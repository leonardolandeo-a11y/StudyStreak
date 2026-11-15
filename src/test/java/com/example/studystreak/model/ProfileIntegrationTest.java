package com.example.studystreak.model;

import com.example.studystreak.repository.UserRepository;
import com.example.studystreak.service.JwtService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.ObjectMapper;
import java.net.*;
import java.net.http.*;
import java.util.*;
import java.sql.*;
import javax.sql.DataSource;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@EnabledIfEnvironmentVariable(named="STUDYSTREAK_PROFILE_POSTGRES_INTEGRATION",matches="true")
class ProfileIntegrationTest {
    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired JwtService jwt;
    @Autowired PasswordEncoder passwords;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate db;
    @Autowired DataSource source;
    User owner, other;
    String token;
    @BeforeEach void setup() {
        assertEquals("studystreak_schema_check", db.queryForObject("select current_database()",String.class));
        assertTrue(db.queryForObject("select current_schema()",String.class).startsWith("ss_audit_profile"));
        owner = user(); other = user(); token = jwt.generateToken(owner);
    }
    User user() {
        var user = new User(); var name="profile_"+UUID.randomUUID().toString().substring(0,12);
        user.setUsername(name); user.setEmail(name+"@invalid.test");user.setPassword(passwords.encode("ProfileTest123!"));
        user.setRole(Role.USER);user.setActive(true);user.setTimeZone("America/Lima");return users.saveAndFlush(user);
    }
    @AfterEach void cleanup() {
        for (var user : List.of(owner,other)) { db.update("delete from study_ledger where user_id=?",user.getId());users.deleteById(user.getId()); }
    }
    HttpResponse<String> request(String method,String path,String body,String bearer) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+path));
        if(bearer!=null)builder.header("Authorization","Bearer "+bearer);
        builder.header("Content-Type","application/json");
        return HttpClient.newHttpClient().send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body)).build(),HttpResponse.BodyHandlers.ofString());
    }
    @Test void validJwtKeepsMissingRoutesAndUnsupportedMethodsDistinctFromAuthentication() throws Exception {
        assertEquals(200,request("GET","/api/profile",null,token).statusCode());
        // An old backend without social mappings reaches the same MVC missing-resource path.
        String unmapped="/api/users/"+other.getId()+"/profile/unmapped-diagnostic";
        assertEquals(401,request("GET",unmapped,null,null).statusCode());
        var missing=request("GET",unmapped,null,token);
        assertEquals(404,missing.statusCode());
        assertEquals(unmapped,json.readTree(missing.body()).path("path").asString());
        assertEquals(403,request("GET","/users/"+other.getId(),null,token).statusCode());
        assertEquals(404,request("GET","/api/users/"+other.getId()+"/profile",null,token).statusCode());
        var wrongMethod=request("POST","/api/profile","{}",token);
        assertEquals(405,wrongMethod.statusCode());
        assertTrue(wrongMethod.headers().firstValue("Allow").orElseThrow().contains("GET"));
        assertEquals(405,request("GET","/refresh",null,null).statusCode());
        assertEquals(401,request("GET","/api/profile",null,"invalid-diagnostic-jwt").statusCode());
        var expired=new JwtService();
        org.springframework.test.util.ReflectionTestUtils.setField(expired,"secretKey",System.getenv("JWT_SECRET"));
        org.springframework.test.util.ReflectionTestUtils.setField(expired,"jwtExpiration",-1000L);
        assertEquals(401,request("GET","/api/profile",null,expired.generateToken(owner)).statusCode());
        var wrongKey=new JwtService();
        org.springframework.test.util.ReflectionTestUtils.setField(wrongKey,"secretKey","ZGlmZmVyZW50LWRpc3Bvc2FibGUtdGVzdC1vbmx5LWp3dC1rZXktMjAyNg==");
        org.springframework.test.util.ReflectionTestUtils.setField(wrongKey,"jwtExpiration",3600000L);
        assertEquals(401,request("GET","/api/profile",null,wrongKey.generateToken(owner)).statusCode());
    }
    @Test void refreshRenewsAccessButDoesNotChangeMissingRouteStatus() throws Exception {
        var login=request("POST","/login",json.writeValueAsString(Map.of("username",owner.getUsername(),"password","ProfileTest123!")),null);
        assertEquals(200,login.statusCode());
        String refresh=json.readTree(login.body()).path("refreshToken").asString();
        var response=request("POST","/refresh",json.writeValueAsString(Map.of("refreshToken",refresh)),null);
        assertEquals(200,response.statusCode());
        String access=json.readTree(response.body()).path("token").asString();
        assertEquals(200,request("GET","/api/profile",null,access).statusCode());
        assertEquals(404,request("GET","/api/users/"+other.getId()+"/profile/unmapped-diagnostic",null,access).statusCode());
        assertEquals(401,request("POST","/refresh",json.writeValueAsString(Map.of("refreshToken",refresh)),null).statusCode());
    }
    @Test void existingUserReadsNullProfileWithUsernameFallbackAndPrivateAccess() throws Exception {
        var response=request("GET","/api/profile",null,token);assertEquals(200,response.statusCode());
        var profile=json.readTree(response.body());assertEquals(owner.getId(),profile.path("id").asLong());
        assertTrue(profile.path("displayName").isNull());assertTrue(profile.path("bio").isNull());
        assertEquals(owner.getUsername(),profile.path("presentationName").asString());
        assertEquals(401,request("GET","/api/profile",null,null).statusCode());
        assertEquals(401,request("PATCH","/api/profile","{\"bio\":\"x\"}",null).statusCode());
        var foreign=request("GET","/api/profile?userId="+other.getId(),null,token);
        assertEquals(owner.getId(),json.readTree(foreign.body()).path("id").asLong());
    }
    @Test void partialUpdatesPersistAndDoNotChangeIdentityOrExistingContracts() throws Exception {
        String originalPassword=owner.getPassword();
        var response=request("PATCH","/api/profile","{\"displayName\":\"  María 李 😀  \",\"bio\":\"<b>Plain text</b>\\nStudy\"}",token);
        assertEquals(200,response.statusCode());assertEquals("María 李 😀",json.readTree(response.body()).path("displayName").asString());
        assertEquals(200,request("PATCH","/api/profile","{\"bio\":\"Only bio\"}",token).statusCode());
        var reloaded=users.findById(owner.getId()).orElseThrow();
        assertEquals("María 李 😀",reloaded.getDisplayName());assertEquals("Only bio",reloaded.getBio());
        assertEquals(owner.getUsername(),reloaded.getUsername());assertEquals(originalPassword,reloaded.getPassword());
        assertEquals(owner.getEmail(),reloaded.getEmail());assertEquals(owner.getRole(),reloaded.getRole());
        var old=request("GET","/users/"+owner.getId(),null,token);assertEquals(200,old.statusCode());
        assertFalse(json.readTree(old.body()).has("displayName"));assertFalse(json.readTree(old.body()).has("bio"));
        assertEquals(200,request("GET","/api/focus-sessions/stats?days=30",null,token).statusCode());
        var login=request("POST","/login",json.writeValueAsString(Map.of("username",owner.getUsername(),"password","ProfileTest123!")),null);
        assertEquals(200,login.statusCode());
        assertEquals(200,request("GET","/api/profile",null,json.readTree(login.body()).path("token").asString()).statusCode());
        assertNull(users.findById(other.getId()).orElseThrow().getDisplayName());
        assertEquals(400,request("PATCH","/api/profile","{\"userId\":"+other.getId()+",\"bio\":\"foreign\"}",token).statusCode());
        assertEquals(200,request("PATCH","/api/profile","{\"displayName\":null}",token).statusCode());
        assertNull(users.findById(owner.getId()).orElseThrow().getDisplayName());
        assertEquals("Only bio",users.findById(owner.getId()).orElseThrow().getBio());
    }
    @Test void invalidPatchIsAtomicAndUnicodeLimitsMatchDatabase() throws Exception {
        var bad = new LinkedHashMap<String,Object>();bad.put("displayName","Valid");bad.put("bio","x".repeat(301));
        assertEquals(400,request("PATCH","/api/profile",json.writeValueAsString(bad),token).statusCode());
        assertNull(users.findById(owner.getId()).orElseThrow().getDisplayName());
        assertEquals(200,request("PATCH","/api/profile",json.writeValueAsString(Map.of("displayName","😀".repeat(60),"bio","😀".repeat(300))),token).statusCode());
        for(String body:List.of("{\"displayName\":7}","{\"username\":\"newname\"}","{\"role\":\"ADMIN\"}","{\"bio\":\"\\u0000\"}")) assertEquals(400,request("PATCH","/api/profile",body,token).statusCode());
    }
    void ledger(User user,String state,String source,boolean verified,int seconds) {
        db.update("insert into study_ledger(id,user_id,goal_name,source,state,verified,planned_seconds,confirmed_seconds,started_at,last_seen_at,completed_at) values(?,?,'Profile test',?,?,?,600,?,clock_timestamp()-interval '1 day',clock_timestamp(),case when ?='COMPLETE' then clock_timestamp() else null end)",UUID.randomUUID(),user.getId(),source,state,verified,seconds,state);
    }
    @Test void verifiedLifetimeTotalsExcludeHistoryAndIncompleteAttempts() throws Exception {
        ledger(owner,"COMPLETE","INDIVIDUAL",true,301);ledger(owner,"COMPLETE","GROUP",true,359);
        ledger(owner,"COMPLETE","LEGACY",false,300);ledger(owner,"COMPLETE","LEGACY",true,300);
        ledger(owner,"COMPLETE","INDIVIDUAL",false,300);ledger(owner,"CANCELLED","GROUP",true,200);
        ledger(owner,"RUNNING","INDIVIDUAL",true,200);ledger(other,"COMPLETE","GROUP",true,300);
        db.update("update study_ledger set completed_at=clock_timestamp()-interval '1 day' where user_id=? and source='LEGACY' and verified=false",owner.getId());
        var response=request("GET","/api/profile",null,token);assertEquals(200,response.statusCode());
        var statistics=json.readTree(response.body()).path("statistics");
        assertEquals(2,statistics.path("studyStreak").asLong());assertEquals(2,statistics.path("bestStudyStreak").asLong());
        assertEquals(2,statistics.path("verifiedSessions").asLong());assertEquals(11d,statistics.path("verifiedMinutes").asDouble());
        db.update("update study_ledger set state='PAUSED' where user_id=? and state='RUNNING'",owner.getId());
        assertEquals(2,json.readTree(request("GET","/api/profile",null,token).body()).path("statistics").path("verifiedSessions").asLong());
        var otherStats=json.readTree(request("GET","/api/profile",null,jwt.generateToken(other)).body()).path("statistics");
        assertEquals(1,otherStats.path("verifiedSessions").asLong());assertEquals(5d,otherStats.path("verifiedMinutes").asDouble());
    }
    @Test void migrationPreservesOldRowsAndSequencesAndCanBeRepeated() throws Exception {
        try(var connection=source.getConnection();var statement=connection.createStatement()) {
            String original=connection.getSchema(), fixture="ss_audit_profile_migration_"+UUID.randomUUID().toString().replace("-","");
            statement.execute("create schema "+fixture);
            try {
                connection.setSchema(fixture);
                statement.execute("create table users(id bigint primary key, username text)");
                statement.execute("insert into users values(7,'before_profile')");
                statement.execute("create sequence untouched increment by 50 start 901");
                statement.execute("create table study_ledger(id integer primary key,state text,confirmed_seconds integer)");
                statement.execute("insert into study_ledger values(9,'COMPLETE',300)");
                var migration=new ResourceDatabasePopulator(new ClassPathResource("db/migrations/2026-11-07_add_user_profile.sql"));
                migration.populate(connection);migration.populate(connection);
                try(var row=statement.executeQuery("select username,display_name,bio from users where id=7")){assertTrue(row.next());assertEquals("before_profile",row.getString(1));assertNull(row.getString(2));assertNull(row.getString(3));}
                try(var row=statement.executeQuery("select last_value from untouched")){assertTrue(row.next());assertEquals(901,row.getLong(1));}
                try(var row=statement.executeQuery("select state,confirmed_seconds from study_ledger where id=9")){assertTrue(row.next());assertEquals("COMPLETE",row.getString(1));assertEquals(300,row.getInt(2));}
                assertEquals(1,statement.executeUpdate("update users set display_name='After migration' where id=7"));
            } finally { statement.execute("rollback");connection.setSchema(original);statement.execute("drop schema "+fixture+" cascade"); }
        }
    }
}
