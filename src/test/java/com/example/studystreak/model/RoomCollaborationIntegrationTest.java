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
class RoomCollaborationIntegrationTest {
    @Autowired com.example.studystreak.collaboration.RoomCollaborationService chat;
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
        db.update("delete from study_room_message where room_id=?",roomId);
        db.update("delete from study_room_member where room_id=?",roomId);db.update("delete from study_room where id=?",roomId);
        db.update("delete from study_room_ban where id like ?",roomId+":%");
        db.update("delete from retired_media_room where name like ?","ss-"+roomId+"-%");
        users.deleteById(host.getId());users.deleteById(viewer.getId());SecurityContextHolder.clearContext();
    }
    @Test void persistedMessagesUseAuthenticatedAuthorAndIdempotentRetry() {
        var id=UUID.randomUUID();login(viewer);
        var sent=chat.send(roomId,id,"  hello room  ");
        assertEquals(viewer.getId(),sent.getAuthorId());assertEquals("hello room",sent.getText());
        assertEquals(id,chat.send(roomId,id,"hello room").getId());
        assertEquals(1,chat.feed(roomId,0).messages().size());
        assertThrows(ConflictException.class,()->chat.send(roomId,id,"different"));
        login(host);assertEquals("hello room",chat.feed(roomId,0).messages().getFirst().getText());
        assertThrows(ConflictException.class,()->chat.send(roomId,id,"hello room"));
    }
    @Test void messagesValidateLengthAndEnforceRateLimit() {
        assertThrows(IllegalArgumentException.class,()->chat.send(roomId,UUID.randomUUID()," "));
        assertThrows(IllegalArgumentException.class,()->chat.send(roomId,UUID.randomUUID(),"x".repeat(1001)));
        chat.send(roomId,UUID.randomUUID(),"hello");
        var failure=assertThrows(org.springframework.web.server.ResponseStatusException.class,()->chat.send(roomId,UUID.randomUUID(),"spam"));
        assertEquals(429,failure.getStatusCode().value());
        assertThrows(IllegalArgumentException.class,()->chat.feed(roomId,-1));
    }
    @Test void onlyHostCanModerateAndRemovedContentCannotBeRecoveredByRetry() {
        login(viewer);var id=UUID.randomUUID();chat.send(roomId,id,"original");
        assertThrows(ForbiddenException.class,()->chat.remove(roomId,id));
        login(host);chat.remove(roomId,id);login(viewer);
        assertTrue(chat.send(roomId,id,"original").isRemoved());
        assertEquals("Message removed by host",chat.feed(roomId,0).messages().getFirst().getText());
    }
    @Test void kickAndClosureRejectEveryCollaborationOperation() {
        media.kick(roomId,viewer.getId());login(viewer);
        assertThrows(ForbiddenException.class,()->chat.feed(roomId,0));
        assertThrows(ForbiddenException.class,()->chat.send(roomId,UUID.randomUUID(),"hello"));
        assertThrows(ForbiddenException.class,()->chat.hand(roomId,true));
        assertThrows(ForbiddenException.class,()->chat.react(roomId,"👏"));
        login(host);rooms.leave(roomId);
        assertThrows(ResourceNotFoundException.class,()->chat.feed(roomId,0));
    }
    @Test void handsAndReactionsSynchronizeExpireAndLeaveNoPermanentReactionHistory() {
        login(viewer);chat.hand(roomId,true);chat.react(roomId,"💡");
        assertThrows(org.springframework.web.server.ResponseStatusException.class,()->chat.react(roomId,"✅"));
        assertThrows(IllegalArgumentException.class,()->chat.react(roomId,"invalid"));
        login(host);var presence=chat.feed(roomId,0).presence().stream().filter(p->p.userId()==viewer.getId()).findFirst().orElseThrow();
        assertTrue(presence.handRaised());assertEquals("💡",presence.reaction());
        db.update("update study_room_member set reaction_at=now()-interval '20 seconds',last_seen_at=now()-interval '100 seconds' where room_id=? and user_id=?",roomId,viewer.getId());
        chat.clearExpiredPresence();
        presence=chat.feed(roomId,0).presence().stream().filter(p->p.userId()==viewer.getId()).findFirst().orElseThrow();
        assertFalse(presence.handRaised());assertNull(presence.reaction());
        login(viewer);chat.hand(roomId,true);chat.hand(roomId,false);rooms.leave(roomId);login(host);
        assertEquals(1,chat.feed(roomId,0).presence().size());
    }
    @Test void recentHistoryIsOrderedPagedAndRetentionDeletesOldRows() {
        for(int i=0;i<27;i++) {
            db.update("insert into study_room_message (id,room_id,author_id,author_name,text,created_at,removed,version) values (?,?,?,?,?,now()- (? * interval '1 second'),false,0)",UUID.randomUUID(),roomId,host.getId(),"Host","message-"+i,i);
        }
        var first=chat.feed(roomId,0);assertEquals(25,first.messages().size());assertEquals(2,first.totalPages());
        assertEquals("message-0",first.messages().getFirst().getText());assertEquals(2,chat.feed(roomId,1).messages().size());
        db.update("update study_room_message set created_at=now()-interval '31 days' where room_id=?",roomId);
        assertTrue(chat.feed(roomId,0).messages().isEmpty());chat.retain();
        assertEquals(0,db.queryForObject("select count(*) from study_room_message where room_id=?",Integer.class,roomId));
    }
    @Test void concurrentRetriesPersistExactlyOneMessage() throws Exception {
        UUID id=UUID.randomUUID();var pool=java.util.concurrent.Executors.newFixedThreadPool(2);
        try {
            java.util.concurrent.Callable<UUID> send=()->{login(viewer);try{return chat.send(roomId,id,"concurrent").getId();}finally{SecurityContextHolder.clearContext();}};
            var results=pool.invokeAll(List.of(send,send));
            for(var result:results)assertEquals(id,result.get());
            assertEquals(1,chat.feed(roomId,0).messages().size());
        } finally {pool.shutdownNow();}
    }
}
