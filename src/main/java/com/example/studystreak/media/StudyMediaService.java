package com.example.studystreak.media;

import com.example.studystreak.exceptions.*;
import com.example.studystreak.model.*;
import com.example.studystreak.repository.*;
import com.example.studystreak.service.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.Instant;
import java.util.*;

@Service
public class StudyMediaService {
    private final CurrentUserService current;
    private final StudyRoomRepository rooms;
    private final StudyRoomMemberRepository members;
    private final MediaConfiguration config;
    private final LiveKitGateway gateway;
    private final RetiredMediaRoomRepository retired;
    private final RoomBanRepository bans;
    private final StudyLedgerService ledger;
    public StudyMediaService(CurrentUserService current, StudyRoomRepository rooms, StudyRoomMemberRepository members,
            MediaConfiguration config, LiveKitGateway gateway, RetiredMediaRoomRepository retired,
            RoomBanRepository bans, StudyLedgerService ledger) {
        this.current=current; this.rooms=rooms; this.members=members; this.config=config; this.gateway=gateway;
        this.retired=retired; this.bans=bans; this.ledger=ledger;
    }
    public record Permission(long userId, boolean canPublish) {}
    public record State(boolean enabled, String epoch, boolean canPublish, List<Permission> permissions) {}
    public record Credentials(String url, String token, String epoch, String identity, boolean canPublish, int ttlSeconds) {}
    public void assertNotBanned(UUID room, long user) {
        if (bans.existsById(room+":"+user)) throw new ForbiddenException("You were removed from this room");
    }
    private StudyRoom member(UUID id, long user) {
        StudyRoom room=rooms.findByIdForUpdate(id).orElseThrow(()->new ResourceNotFoundException("Study room closed or unavailable"));
        assertNotBanned(id,user);
        if (members.findByRoomIdAndUserId(id,user).isEmpty()) throw new ForbiddenException("Room membership required");
        return room;
    }
    private boolean publisher(StudyRoom room, StudyRoomMember member) {
        return room.getOwner().getId().equals(member.getUser().getId()) || member.isMediaPublisher();
    }
    private String epoch(StudyRoom room) {
        if (room.getMediaEpoch()==null) room.setMediaEpoch(UUID.randomUUID().toString());
        return "ss-"+room.getId()+"-"+room.getMediaEpoch();
    }
    @Transactional
    public State state(UUID id) {
        long user=current.getCurrentUserId(); StudyRoom room=member(id,user);
        var list=members.findByRoomId(id);
        return new State(config.ready(),epoch(room),publisher(room,members.findByRoomIdAndUserId(id,user).orElseThrow()),
                list.stream().map(m->new Permission(m.getUser().getId(),publisher(room,m))).toList());
    }
    @Transactional
    public Credentials token(UUID id) { return token(id,true); }
    @Transactional
    public Credentials token(UUID id, boolean requestPublication) {
        long user=current.getCurrentUserId(); StudyRoom room=member(id,user);
        if (!config.ready()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"LiveKit is not configured");
        StudyRoomMember membership=members.findByRoomIdAndUserId(id,user).orElseThrow();
        if (membership.getLastMediaTokenAt()!=null && membership.getLastMediaTokenAt().isAfter(Instant.now().minusSeconds(2)))
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Retry media connection shortly");
        membership.setLastMediaTokenAt(Instant.now());
        String identity=UUID.randomUUID().toString(); // per connection, never a user-supplied identity
        boolean publish=requestPublication && publisher(room,membership); String name=epoch(room);
        return new Credentials(config.getUrl(),gateway.token(name,identity,membership.getUser().getUsername(),publish),name,identity,publish,60);
    }
    private void host(StudyRoom room,long user) {
        if (!room.getOwner().getId().equals(user)) throw new ForbiddenException("Only the host can moderate media");
    }
    /** Caller holds the study-room lock; durable tombstone and epoch change commit together. */
    public void rotate(StudyRoom room) {
        if (room.getMediaEpoch()!=null) retired.save(new RetiredMediaRoom(epoch(room)));
        room.setMediaEpoch(UUID.randomUUID().toString());
    }
    @Transactional
    public void permission(UUID id,long target,boolean allowed) {
        long user=current.getCurrentUserId(); StudyRoom room=member(id,user); host(room,user);
        var membership=members.findByRoomIdAndUserId(id,target).orElseThrow(()->new ResourceNotFoundException("Member unavailable"));
        if (room.getOwner().getId().equals(target)) throw new ConflictException("Transfer host before revoking host publication");
        if (membership.isMediaPublisher()!=allowed) { membership.setMediaPublisher(allowed); rotate(room); }
    }
    @Transactional
    public void kick(UUID id,long target) {
        long user=current.getCurrentUserId(); StudyRoom room=member(id,user); host(room,user);
        if (user==target) throw new ConflictException("Use Close room to leave as host");
        var membership=members.findByRoomIdAndUserId(id,target).orElseThrow(()->new ResourceNotFoundException("Member unavailable"));
        ledger.leave(id,target); bans.save(new RoomBan(id,target)); members.delete(membership); rotate(room);
    }
}
