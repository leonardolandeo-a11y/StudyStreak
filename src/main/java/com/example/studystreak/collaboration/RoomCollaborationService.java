package com.example.studystreak.collaboration;
import com.example.studystreak.exceptions.*;
import com.example.studystreak.model.*;
import com.example.studystreak.repository.*;
import com.example.studystreak.service.CurrentUserService;
import com.example.studystreak.media.StudyMediaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.Instant;
import java.util.*;
@Service
public class RoomCollaborationService {
    private final CurrentUserService current;
    private final StudyRoomRepository rooms;
    private final StudyRoomMemberRepository members;
    private final RoomMessageRepository messages;
    private final StudyMediaService media;
    public RoomCollaborationService(CurrentUserService current,StudyRoomRepository rooms,StudyRoomMemberRepository members,RoomMessageRepository messages,StudyMediaService media) {
        this.current=current;this.rooms=rooms;this.members=members;this.messages=messages;this.media=media;
    }
    private StudyRoom room(UUID id,long user) {
        var room=rooms.findByIdForUpdate(id).orElseThrow(()->new ResourceNotFoundException("Room closed"));
        media.assertNotBanned(id,user);
        if(members.findByRoomIdAndUserId(id,user).isEmpty())throw new ForbiddenException("Room membership required");
        return room;
    }
    public record Presence(long userId,boolean handRaised,String reaction) {}
    public record Feed(List<RoomMessage> messages,int totalPages,List<Presence> presence) {}
    @Transactional
    public Feed feed(UUID id,int page) {
        if(page<0||page>1000)throw new IllegalArgumentException("Invalid history page");
        room(id,current.getCurrentUserId());
        var result=messages.findByRoomIdAndCreatedAtAfterOrderByCreatedAtDescIdDesc(id,Instant.now().minusSeconds(30L*86400),PageRequest.of(page,25));
        var presence=members.findByRoomId(id).stream().map(member->new Presence(member.getUser().getId(),member.isHandRaised(),
                member.getReactionAt()!=null&&member.getReactionAt().isAfter(Instant.now().minusSeconds(10))?member.getReaction():null)).toList();
        return new Feed(result.getContent(),result.getTotalPages(),presence);
    }
    @Transactional
    public RoomMessage send(UUID id,UUID messageId,String text) {
        long user=current.getCurrentUserId();room(id,user);
        var existing=messages.findById(messageId);
        if(existing.isPresent()) {
            var message=existing.get();
            if(!message.getRoomId().equals(id)||!message.getAuthorId().equals(user))throw new ConflictException("Message id already used");
            if(!message.isRemoved()&&!message.getText().equals(text.strip()))throw new ConflictException("Message id has different content");
            return message;
        }
        String content=text.strip();if(content.isEmpty()||content.length()>1000)throw new IllegalArgumentException("Message must contain 1–1000 characters");
        var member=members.findByRoomIdAndUserId(id,user).orElseThrow();
        if(member.getLastChatAt()!=null&&member.getLastChatAt().isAfter(Instant.now().minusSeconds(2)))throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Wait before sending another message");
        member.setLastChatAt(Instant.now());return messages.save(new RoomMessage(messageId,id,user,member.getUser().getUsername(),content));
    }
    @Transactional public void remove(UUID id,UUID messageId) {
        long user=current.getCurrentUserId();var room=room(id,user);
        if(!room.getOwner().getId().equals(user))throw new ForbiddenException("Only the host can moderate messages");
        var message=messages.findById(messageId).filter(item->item.getRoomId().equals(id)).orElseThrow(()->new ResourceNotFoundException("Message unavailable"));message.remove();
    }
    @Transactional public void hand(UUID id,boolean raised) {
        long user=current.getCurrentUserId();room(id,user);members.findByRoomIdAndUserId(id,user).orElseThrow().setHandRaised(raised);
    }
    @Transactional public void react(UUID id,String reaction) {
        if(!Set.of("👏","💡","✅").contains(reaction))throw new IllegalArgumentException("Unsupported reaction");
        long user=current.getCurrentUserId();room(id,user);var member=members.findByRoomIdAndUserId(id,user).orElseThrow();
        if(member.getReactionAt()!=null&&member.getReactionAt().isAfter(Instant.now().minusSeconds(3)))throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Wait before reacting again");
        member.setReaction(reaction);member.setReactionAt(Instant.now());
    }
    // Ephemeral values are removed from PostgreSQL rather than retained as history.
    @Scheduled(fixedDelay=10000) @Transactional public void clearExpiredPresence() {
        members.clearExpiredReactions(Instant.now().minusSeconds(10));
        members.clearInactiveHands(Instant.now().minusSeconds(90));
    }
    @Scheduled(fixedDelay=3600000) @Transactional public void retain() { messages.deleteByCreatedAtBefore(Instant.now().minusSeconds(30L*86400)); }
}
