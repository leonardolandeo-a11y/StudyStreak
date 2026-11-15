package com.example.studystreak.model;

import com.example.studystreak.repository.UserRepository;
import com.example.studystreak.service.JwtService;
import com.example.studystreak.service.ProfileImageStorage;
import com.example.studystreak.service.ProfileImageValidator;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import java.net.*;
import java.net.http.*;
import java.nio.file.*;
import java.util.*;
import java.io.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import static org.junit.jupiter.api.Assertions.*;
import static com.example.studystreak.service.ProfileImageStorage.Slot.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@EnabledIfEnvironmentVariable(named="STUDYSTREAK_PROFILE_POSTGRES_INTEGRATION",matches="true")
class ProfileImageIntegrationTest {
    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate db;
    @Autowired ProfileImageStorage images;
    @Autowired ProfileImageValidator validator;
    @Value("${profile.images.directory}") String directory;
    User owner,other;
    String token;
    @BeforeEach void setup() {
        assertEquals("studystreak_schema_check",db.queryForObject("select current_database()",String.class));
        assertTrue(db.queryForObject("select current_schema()",String.class).startsWith("ss_audit_profile"));
        assertTrue(Path.of(directory).toAbsolutePath().toString().contains(".local/profile-backend/test-images"));
        owner=user();other=user();token=jwt.generateToken(owner);
    }
    User user() {
        var u=new User();String name="image_"+UUID.randomUUID().toString().substring(0,12);
        u.setUsername(name);u.setEmail(name+"@example.invalid");u.setPassword("unused");u.setRole(Role.USER);u.setActive(true);return users.saveAndFlush(u);
    }
    @AfterEach void cleanup() {
        if(owner==null||other==null)return;
        for(var user:List.of(owner,other)) {
            images.delete(user.getId(),AVATAR);images.delete(user.getId(),BANNER);users.deleteById(user.getId());
        }
    }
    byte[] fixture(String extension) throws IOException {
        try(var in=getClass().getResourceAsStream("/profile/image."+extension)){return in.readAllBytes();}
    }
    HttpResponse<byte[]> request(String method,String path,byte[] bytes,String type,String bearer) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+path));
        if(bearer!=null)builder.header("Authorization","Bearer "+bearer);
        if(type!=null)builder.header("Content-Type",type);
        // Deliberately malicious client filename must never be used for storage.
        if(method.equals("PUT"))builder.header("Content-Disposition","attachment; filename=\"../../outside.html\"");
        return HttpClient.newHttpClient().send(builder.method(method,bytes==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofByteArray(bytes)).build(),HttpResponse.BodyHandlers.ofByteArray());
    }
    @Test void privateRoutesRejectAnonymousAndCannotSelectAnotherOwner() throws Exception {
        for(String route:List.of("avatar","banner"))for(String verb:List.of("GET","PUT","DELETE"))
            assertEquals(401,request(verb,"/api/profile/"+route,fixture("png"),"image/png",null).statusCode());
        assertEquals(404,request("GET","/api/profile/avatar",null,null,token).statusCode());
        assertEquals(204,request("PUT","/api/profile/avatar",fixture("png"),"image/png",jwt.generateToken(other)).statusCode());
        assertEquals(404,request("GET","/api/profile/avatar?userId="+other.getId(),null,null,token).statusCode());
        assertEquals(204,request("PUT","/api/profile/avatar?userId="+other.getId(),fixture("jpg"),"image/jpeg",token).statusCode());
        assertArrayEquals(fixture("png"),images.get(other.getId(),AVATAR).bytes());
        assertArrayEquals(fixture("jpg"),images.get(owner.getId(),AVATAR).bytes());
    }
    @Test void supportsAllFormatsReplacementDeletionAndPersistenceAcrossStorageRestart() throws Exception {
        for(String route:List.of("avatar","banner")) {
            for(var entry:Map.of("png","image/png","jpg","image/jpeg","webp","image/webp").entrySet()) {
                byte[] bytes=fixture(entry.getKey());
                assertEquals(204,request("PUT","/api/profile/"+route,bytes,entry.getValue(),token).statusCode());
                var response=request("GET","/api/profile/"+route,null,null,token);
                assertEquals(200,response.statusCode());assertArrayEquals(bytes,response.body());
                assertEquals(entry.getValue(),response.headers().firstValue("Content-Type").orElseThrow());
                assertEquals("no-store",response.headers().firstValue("Cache-Control").orElseThrow());
                assertEquals("nosniff",response.headers().firstValue("X-Content-Type-Options").orElseThrow());
                assertArrayEquals(bytes,new ProfileImageStorage(directory,validator).get(owner.getId(),route.equals("avatar")?AVATAR:BANNER).bytes());
            }
            assertEquals(204,request("DELETE","/api/profile/"+route,null,null,token).statusCode());
            assertEquals(204,request("DELETE","/api/profile/"+route,null,null,token).statusCode());
            assertEquals(404,request("GET","/api/profile/"+route,null,null,token).statusCode());
        }
        assertFalse(Files.exists(Path.of(directory).resolve("outside.html")));
        assertEquals(200,request("GET","/api/profile",null,null,token).statusCode());
        assertEquals(200,request("GET","/api/focus-sessions/stats?days=7",null,null,token).statusCode());
    }
    @Test void rejectsInvalidMimeSpoofedCorruptAndOverLimitBodiesWithoutReplacing() throws Exception {
        assertEquals(204,request("PUT","/api/profile/avatar",fixture("png"),"image/png",token).statusCode());
        assertEquals(415,request("PUT","/api/profile/avatar","<svg/>".getBytes(),"image/svg+xml",token).statusCode());
        assertEquals(415,request("PUT","/api/profile/avatar","<html>".getBytes(),"text/html",token).statusCode());
        assertEquals(400,request("PUT","/api/profile/avatar",fixture("png"),"image/jpeg",token).statusCode());
        assertEquals(400,request("PUT","/api/profile/avatar",new byte[0],"image/png",token).statusCode());
        assertEquals(400,request("PUT","/api/profile/avatar",Arrays.copyOf(fixture("webp"),18),"image/webp",token).statusCode());
        assertEquals(413,request("PUT","/api/profile/avatar",new byte[2*1024*1024+1],"image/png",token).statusCode());
        assertEquals(413,request("PUT","/api/profile/banner",new byte[5*1024*1024+1],"image/png",token).statusCode());
        assertArrayEquals(fixture("png"),images.get(owner.getId(),AVATAR).bytes());
    }
    @Test void bannerAboveExistingMultipartLimitWorksThroughActualHttp() throws Exception {
        var image=new BufferedImage(1100,1100,BufferedImage.TYPE_INT_RGB);var random=new Random(43);
        for(int y=0;y<1100;y++)for(int x=0;x<1100;x++)image.setRGB(x,y,random.nextInt(0x1000000));
        var out=new ByteArrayOutputStream();ImageIO.write(image,"png",out);byte[] bytes=out.toByteArray();
        assertTrue(bytes.length>3*1024*1024 && bytes.length<5*1024*1024);
        assertEquals(204,request("PUT","/api/profile/banner",bytes,"image/png",token).statusCode());
        assertArrayEquals(bytes,request("GET","/api/profile/banner",null,null,token).body());
    }
}
