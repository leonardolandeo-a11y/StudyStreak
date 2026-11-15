package com.example.studystreak.model;

import com.example.studystreak.repository.*;
import com.example.studystreak.service.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.ObjectMapper;
import javax.sql.DataSource;
import java.net.*;
import java.net.http.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@EnabledIfEnvironmentVariable(named="STUDYSTREAK_SOCIAL_POSTGRES_INTEGRATION",matches="true")
class SocialProfileIntegrationTest {
    @LocalServerPort int port;
    @Autowired JdbcTemplate db;
    @Autowired DataSource source;
    @Autowired UserRepository users;
    @Autowired TrackingLinkRepository links;
    @Autowired JwtService jwt;
    @Autowired ObjectMapper json;
    @Autowired ProfileImageStorage images;
    User owner,partner,stranger;
    String token;
    final String migration="db/migrations/2026-11-07_social_profiles_presence.sql";
    @BeforeEach void setup() {
        assertEquals("studystreak_schema_check",db.queryForObject("select current_database()",String.class));
        assertEquals("ss_audit_profile_social",db.queryForObject("select current_schema()",String.class));
        new ResourceDatabasePopulator(new ClassPathResource(migration)).execute(source);
        owner=user();partner=user();stranger=user();token=jwt.generateToken(owner);
    }
    User user() {
        User u=new User();String name="social_"+UUID.randomUUID().toString().substring(0,12);
        u.setUsername(name);u.setEmail(name+"@invalid.test");u.setPassword("not-a-password");u.setRole(Role.USER);u.setActive(true);
        return users.saveAndFlush(u);
    }
    @AfterEach void cleanup() {
        for(var u:List.of(owner,partner,stranger)) {
            db.update("delete from tracking_link where requester_id=? or receiver_id=?",u.getId(),u.getId());
            db.update("delete from study_ledger where user_id=?",u.getId());
            images.delete(u.getId(),ProfileImageStorage.Slot.AVATAR);images.delete(u.getId(),ProfileImageStorage.Slot.BANNER);
            users.deleteById(u.getId());
        }
    }
    HttpResponse<String> request(String method,String path,String body,String bearer) throws Exception {
        var r=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+path)).header("Content-Type","application/json");
        if(bearer!=null)r.header("Authorization","Bearer "+bearer);
        return HttpClient.newHttpClient().send(r.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body)).build(),HttpResponse.BodyHandlers.ofString());
    }
    String path(User u) { return "/api/users/"+u.getId()+"/profile"; }
    void accept() { links.saveAndFlush(new TrackingLink(owner,partner,TrackingStatus.ACCEPTED)); }
    void privacy(String bearer,boolean online,boolean last,boolean minutes,boolean sessions) throws Exception {
        assertEquals(200,request("PUT","/api/profile/privacy",json.writeValueAsString(Map.of("showPresence",online,"showLastSeen",last,"shareVerifiedMinutes",minutes,"shareVerifiedSessions",sessions)),bearer).statusCode());
    }
    HttpResponse<String> pulse(UUID session) throws Exception { return request("POST","/api/presence/heartbeat","{\"sessionId\":\""+session+"\"}",token); }
    @Test void acceptedTrackingOnlyForProfilesImagesAndPresenceAndNoForeignEdits() throws Exception {
        assertEquals(401,request("GET",path(partner),null,null).statusCode());
        assertEquals(404,request("GET",path(partner),null,token).statusCode());
        var link=links.saveAndFlush(new TrackingLink(partner,owner,TrackingStatus.PENDING));
        assertEquals(404,request("GET",path(partner),null,token).statusCode());
        link.setStatus(TrackingStatus.ACCEPTED);links.saveAndFlush(link);
        partner.setDisplayName("Partner 李");partner.setBio("<b>Plain text</b>");partner.setRegistrationDate(java.time.LocalDate.of(2025,2,3));users.saveAndFlush(partner);
        var response=request("GET",path(partner),null,token);assertEquals(200,response.statusCode());
        var profile=json.readTree(response.body());assertEquals("Partner 李",profile.path("presentationName").asString());
        assertEquals("2025-02-03",profile.path("registrationDate").asString());
        for(String key:List.of("email","password","role","timeZone"))assertFalse(profile.has(key));
        assertTrue(profile.path("statistics").isEmpty());assertEquals("HIDDEN",profile.path("presence").path("status").asString());
        assertEquals("no-store",response.headers().firstValue("Cache-Control").orElseThrow());
        assertEquals(200,request("GET",path(owner),null,token).statusCode());
        assertTrue(json.readTree(request("GET",path(owner),null,token).body()).path("registrationDate").isNull());
        assertEquals(404,request("GET",path(stranger),null,token).statusCode());
        assertEquals(404,request("GET","/api/users/"+stranger.getId()+"/presence",null,token).statusCode());
        for(String slot:List.of("avatar","banner")) {
            try(var file=getClass().getResourceAsStream("/profile/image.png")) { images.put(partner.getId(),ProfileImageStorage.Slot.valueOf(slot.toUpperCase()),file,"image/png"); }
            var r=request("GET",path(partner)+"/"+slot,null,token);assertEquals(200,r.statusCode());
            assertEquals("image/png",r.headers().firstValue("Content-Type").orElseThrow());
            assertEquals(404,request("GET",path(partner)+"/"+slot,null,jwt.generateToken(stranger)).statusCode());
            assertTrue(request("PUT",path(partner)+"/"+slot,"{}",token).statusCode() >= 400);
            assertEquals(200,request("GET",path(partner)+"/"+slot,null,token).statusCode());
        }
        assertTrue(request("PATCH",path(partner),"{}",token).statusCode() >= 400);
        assertEquals("Partner 李",users.findById(partner.getId()).orElseThrow().getDisplayName());
        links.delete(link);
        assertEquals(404,request("GET",path(partner),null,token).statusCode());
        assertEquals(404,request("GET",path(partner)+"/avatar",null,token).statusCode());
        // Existing private endpoint still ignores foreign query IDs.
        assertEquals(owner.getId(),json.readTree(request("GET","/api/profile?userId="+partner.getId(),null,token).body()).path("id").asLong());
    }
    @Test void statisticsRequireIndividualConsentAndOnlyUseTargetVerifiedTotals() throws Exception {
        accept();
        db.update("insert into study_ledger(id,user_id,goal_name,source,state,verified,planned_seconds,confirmed_seconds,started_at,last_seen_at,completed_at) values(?,?,'private goal','INDIVIDUAL','COMPLETE',true,600,300,clock_timestamp(),clock_timestamp(),clock_timestamp())",UUID.randomUUID(),partner.getId());
        assertTrue(json.readTree(request("GET",path(partner),null,token).body()).path("statistics").isEmpty());
        privacy(jwt.generateToken(partner),false,false,true,false);
        var stats=json.readTree(request("GET",path(partner),null,token).body()).path("statistics");assertEquals(5,stats.path("verifiedMinutes").asDouble());assertFalse(stats.has("verifiedSessions"));
        privacy(jwt.generateToken(partner),false,false,false,true);
        stats=json.readTree(request("GET",path(partner),null,token).body()).path("statistics");assertEquals(1,stats.path("verifiedSessions").asInt());assertFalse(stats.has("verifiedMinutes"));
        privacy(jwt.generateToken(partner),false,false,false,false);
        assertTrue(json.readTree(request("GET",path(partner),null,token).body()).path("statistics").isEmpty());
    }
    @Test void presenceTtlMultipleSessionsThrottlingAndPrivacy() throws Exception {
        var first=UUID.randomUUID();var second=UUID.randomUUID();
        assertEquals("HIDDEN",json.readTree(pulse(first).body()).path("status").asString());
        assertEquals(0,db.queryForObject("select count(*) from presence_session where user_id=?",Integer.class,owner.getId()));
        privacy(token,true,true,false,false);
        accept();
        assertEquals("OFFLINE",json.readTree(request("GET","/api/users/"+owner.getId()+"/presence",null,token).body()).path("status").asString());
        assertEquals("ONLINE",json.readTree(pulse(first).body()).path("status").asString());
        var visible=json.readTree(request("GET","/api/users/"+owner.getId()+"/presence",null,jwt.generateToken(partner)).body());
        assertEquals("ONLINE",visible.path("status").asString());assertFalse(visible.path("lastSeenAt").isNull());
        var seen=db.queryForObject("select last_active_at from social_preferences where user_id=?",java.sql.Timestamp.class,owner.getId());
        pulse(first);assertEquals(seen,db.queryForObject("select last_active_at from social_preferences where user_id=?",java.sql.Timestamp.class,owner.getId()));
        pulse(second);
        db.update("update presence_session set last_seen_at=clock_timestamp()-interval '91 seconds' where user_id=? and session_id=?",owner.getId(),first);
        assertEquals("ONLINE",json.readTree(request("GET","/api/users/"+owner.getId()+"/presence",null,token).body()).path("status").asString());
        db.update("update presence_session set last_seen_at=clock_timestamp()-interval '91 seconds' where user_id=?",owner.getId());
        var expired=json.readTree(request("GET","/api/users/"+owner.getId()+"/presence",null,token).body());
        assertEquals("OFFLINE",expired.path("status").asString());assertFalse(expired.path("lastSeenAt").isNull());
        privacy(token,false,true,false,false);assertEquals("HIDDEN",json.readTree(pulse(first).body()).path("status").asString());
        privacy(token,true,false,false,false);assertTrue(json.readTree(pulse(first).body()).path("lastSeenAt").isNull());
        privacy(token,false,false,false,false);var hidden=json.readTree(pulse(first).body());assertEquals("HIDDEN",hidden.path("status").asString());assertTrue(hidden.path("lastSeenAt").isNull());
        assertEquals(0,db.queryForObject("select count(*) from presence_session where user_id=?",Integer.class,owner.getId()));
        var hiddenFromPartner=json.readTree(request("GET","/api/users/"+owner.getId()+"/presence",null,jwt.generateToken(partner)).body());
        assertEquals("HIDDEN",hiddenFromPartner.path("status").asString());assertTrue(hiddenFromPartner.path("lastSeenAt").isNull());
        assertNull(db.queryForObject("select last_active_at from social_preferences where user_id=?",java.sql.Timestamp.class,owner.getId()));
        assertEquals(400,request("POST","/api/presence/heartbeat","{}",token).statusCode());
        assertEquals(400,request("PUT","/api/profile/privacy","{}",token).statusCode());
        assertEquals(401,request("POST","/api/presence/heartbeat","{\"sessionId\":\""+first+"\"}",null).statusCode());
    }
    @Test void migrationIsRepeatableAndDoesNotBackfillDatesOrChangeHistory() {
        new ResourceDatabasePopulator(new ClassPathResource(migration)).execute(source);
        assertNull(users.findById(owner.getId()).orElseThrow().getRegistrationDate());
        assertEquals("not-a-password",users.findById(owner.getId()).orElseThrow().getPassword());
        assertEquals(0,db.queryForObject("select count(*) from social_preferences where user_id=?",Integer.class,owner.getId()));
    }
}
