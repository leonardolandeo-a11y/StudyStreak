package com.example.studystreak.model;
import com.example.studystreak.media.*;
import com.example.studystreak.service.*;
import com.example.studystreak.repository.*;
import com.example.studystreak.dto.Room.*;
import com.example.studystreak.exceptions.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class StudyMediaIntegrationTest {
    @Autowired StudyRoomService rooms;
    @Autowired StudyMediaService media;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate db;
    private User host,viewer;
    private UUID roomId;
    private User user() {
        var user=new User();var name="media_"+UUID.randomUUID();user.setUsername(name);user.setEmail(name+"@test.invalid");
        user.setPassword("test");user.setRole(Role.USER);user.setTimeZone("America/Lima");return users.saveAndFlush(user);
    }
    private void login(User user) {SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user.getUsername(),null,List.of()));}
    @BeforeEach void setup() {
        host=user();viewer=user();login(host);var room=rooms.create(new StudyRoomRequest("Media test"));roomId=room.id();
        login(viewer);rooms.join(new StudyRoomJoinRequest(room.inviteCode()));login(host);
    }
    @AfterEach void cleanup() {
        db.update("delete from study_room_member where room_id=?",roomId);db.update("delete from study_room where id=?",roomId);
        db.update("delete from study_room_ban where id like ?",roomId+":%");
        db.update("delete from retired_media_room where name like ?","ss-"+roomId+"-%");
        users.deleteById(host.getId());users.deleteById(viewer.getId());SecurityContextHolder.clearContext();
    }
    @Test void transferRevokesFormerHostAndMovesAllConnectionsToAnotherEpoch() {
        String before=media.state(roomId).epoch();assertTrue(media.state(roomId).canPublish());
        rooms.transferHost(roomId,viewer.getId());assertFalse(media.state(roomId).canPublish());
        assertNotEquals(before,media.state(roomId).epoch());login(viewer);assertTrue(media.state(roomId).canPublish());
        assertEquals(1,db.queryForObject("select count(*) from retired_media_room where name=?",Integer.class,before));
    }
    @Test void kickedMemberCannotReadMediaOrRejoinWithKnownInvitation() {
        var room=rooms.get(roomId);String before=media.state(roomId).epoch();media.kick(roomId,viewer.getId());
        assertNotEquals(before,media.state(roomId).epoch());login(viewer);
        assertThrows(ForbiddenException.class,()->media.state(roomId));
        assertThrows(ForbiddenException.class,()->rooms.join(new StudyRoomJoinRequest(room.inviteCode())));
        assertThrows(ForbiddenException.class,()->media.token(roomId));
    }
    @Test void closureRetiresMediaAndPreservesTimerUntilActualClosure() {
        var before=rooms.get(roomId);String epoch=media.state(roomId).epoch();media.permission(roomId,viewer.getId(),true);
        var after=rooms.get(roomId);assertEquals(before.phase(),after.phase());assertEquals(before.remainingSeconds(),after.remainingSeconds());
        rooms.leave(roomId);login(viewer);assertThrows(ResourceNotFoundException.class,()->media.state(roomId));
        assertEquals(1,db.queryForObject("select count(*) from retired_media_room where name=?",Integer.class,epoch));
    }
}
