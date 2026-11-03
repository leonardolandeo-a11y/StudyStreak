package com.example.studystreak.service;

import com.example.studystreak.dto.Room.*;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.model.StudyRoom;
import com.example.studystreak.model.StudyRoomMember;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.StudyRoomMemberRepository;
import com.example.studystreak.repository.StudyRoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class StudyRoomServiceTest {
    private final CurrentUserService current = mock(CurrentUserService.class);
    private final StudyRoomRepository rooms = mock(StudyRoomRepository.class);
    private final StudyRoomMemberRepository members = mock(StudyRoomMemberRepository.class);
    private final StudyRoomService service = new StudyRoomService(current, rooms, members);
    private final UUID roomId = UUID.randomUUID();
    private final User owner = mock(User.class);
    private final User visitor = mock(User.class);
    private StudyRoom room;

    @BeforeEach
    void setup() {
        when(owner.getId()).thenReturn(10L);
        when(owner.getUsername()).thenReturn("host");
        when(visitor.getId()).thenReturn(20L);
        when(visitor.getUsername()).thenReturn("friend");
        room = new StudyRoom(roomId, "ABCDEFGHJK", "Study Together", owner, Instant.now());
        when(rooms.findById(roomId)).thenReturn(Optional.of(room));
        when(rooms.findByIdForUpdate(roomId)).thenReturn(Optional.of(room));
        when(members.findByRoomId(roomId)).thenReturn(List.of());
    }

    @Test
    void privateRoomsRequireMembershipToReadOrHeartbeat() {
        when(current.getCurrentUserId()).thenReturn(20L);
        assertThrows(ForbiddenException.class, () -> service.get(roomId));
        assertThrows(ForbiddenException.class, () -> service.heartbeat(roomId, new StudyRoomHeartbeat(true)));
        assertThrows(ForbiddenException.class, () ->
                service.timer(roomId, new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.START)));
        verify(members, never()).save(any());
    }

    @Test
    void hostCanStartAndPauseSharedServerClock() {
        when(current.getCurrentUserId()).thenReturn(10L);
        when(members.findByRoomIdAndUserId(roomId, 10L))
                .thenReturn(Optional.of(new StudyRoomMember(room, owner, Instant.now())));
        var started = service.timer(roomId, new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.START));
        assertEquals("RUNNING", started.timerStatus());
        assertNotNull(started.endsAt());
        assertEquals("FOCUS", started.phase());
        assertTrue(started.remainingSeconds() <= 1500 && started.remainingSeconds() >= 1498);
        var paused = service.timer(roomId, new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.PAUSE));
        assertEquals("PAUSED", paused.timerStatus());
        assertNull(paused.endsAt());
        var shortBreak = service.timer(roomId, new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.BREAK));
        assertEquals("BREAK", shortBreak.phase());
        assertEquals(300, shortBreak.remainingSeconds());
        assertNull(shortBreak.endsAt());
    }

    @Test
    void nonHostMemberCannotChangeTimerOrCloseRoomForOthers() {
        when(current.getCurrentUserId()).thenReturn(20L);
        when(members.findByRoomIdAndUserId(roomId, 20L))
                .thenReturn(Optional.of(new StudyRoomMember(room, visitor, Instant.now())));
        assertThrows(ForbiddenException.class, () ->
                service.timer(roomId, new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.RESET)));
        service.leave(roomId);
        verify(members).delete(any(StudyRoomMember.class));
        verify(rooms, never()).delete(any());
    }

    @Test
    void roomOwnerClosingDeletesMembershipsAndRoom() {
        when(current.getCurrentUserId()).thenReturn(10L);
        when(members.findByRoomIdAndUserId(roomId, 10L))
                .thenReturn(Optional.of(new StudyRoomMember(room, owner, Instant.now())));
        service.leave(roomId);
        var ordered = inOrder(members, rooms);
        ordered.verify(members).deleteByRoomId(roomId);
        ordered.verify(rooms).delete(room);
    }

    @Test
    void createCreatesRandomInviteAndOwnerMembership() {
        when(current.getCurrentUser()).thenReturn(owner);
        when(rooms.save(any(StudyRoom.class))).thenAnswer(call -> call.getArgument(0));
        var created = service.create(new StudyRoomRequest("  Math buddies  "));
        assertEquals("Math buddies", created.name());
        assertEquals(10, created.inviteCode().length());
        assertEquals(10L, created.ownerId());
        verify(members).save(any(StudyRoomMember.class));
    }

    @Test
    void inviteOnlyJoinAddsMemberAndRejectsInvalidCode() {
        when(current.getCurrentUserId()).thenReturn(20L);
        when(current.getCurrentUser()).thenReturn(visitor);
        when(rooms.findByCodeForUpdate("ABCDEFGHJK")).thenReturn(Optional.of(room));
        var joined = service.join(new StudyRoomJoinRequest("abcdefghjk"));
        assertEquals(roomId, joined.id());
        verify(members).save(any(StudyRoomMember.class));
        assertThrows(RuntimeException.class, () -> service.join(new StudyRoomJoinRequest("bad-code")));
    }

    @Test
    void heartbeatExposesStudyingOnlyForRecentOnlineMembers() {
        when(current.getCurrentUserId()).thenReturn(20L);
        StudyRoomMember present = new StudyRoomMember(room, visitor, Instant.now());
        StudyRoomMember stale = new StudyRoomMember(room, owner, Instant.now().minusSeconds(100));
        stale.setStudying(true);
        when(members.findByRoomIdAndUserId(roomId, 20L)).thenReturn(Optional.of(present));
        when(members.findByRoomId(roomId)).thenReturn(List.of(present, stale));
        var result = service.heartbeat(roomId, new StudyRoomHeartbeat(true));
        assertTrue(result.members().get(0).online());
        assertTrue(result.members().get(0).studying());
        assertFalse(result.members().get(1).online());
        assertFalse(result.members().get(1).studying());
    }

    private void asHost() {
        when(current.getCurrentUserId()).thenReturn(10L);
        when(members.findByRoomIdAndUserId(roomId, 10L))
                .thenReturn(Optional.of(new StudyRoomMember(room, owner, Instant.now())));
    }

    @Test
    void staleDeviceCannotOverwriteTimer() {
        asHost();
        room.setVersion(3L);
        assertThrows(com.example.studystreak.exceptions.ConflictException.class, () ->
                service.timer(roomId, new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.RESET, 2L)));
        assertEquals("PAUSED", room.getTimerStatus());
        verify(rooms, never()).saveAndFlush(any());
    }

    @Test
    void repeatedStartDoesNotMoveDeadline() {
        asHost();
        service.timer(roomId, new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.START));
        Instant deadline = room.getEndsAt();
        service.timer(roomId, new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.START));
        assertEquals(deadline, room.getEndsAt());
    }

    @Test
    void presenceOnlyHeartbeatPreservesOtherDeviceStudyStatus() {
        asHost();
        var member = new StudyRoomMember(room, owner, Instant.now().minusSeconds(100));
        member.setStudying(true);
        when(members.findByRoomIdAndUserId(roomId, 10L)).thenReturn(Optional.of(member));
        service.heartbeat(roomId, new StudyRoomHeartbeat(null));
        assertTrue(member.isStudying());
        assertTrue(member.getLastSeenAt().isAfter(Instant.now().minusSeconds(2)));
    }

    @Test
    void hostTransferImmediatelyRevokesPreviousHostControls() {
        asHost();
        when(members.findByRoomIdAndUserId(roomId, 20L))
                .thenReturn(Optional.of(new StudyRoomMember(room, visitor, Instant.now())));
        assertEquals(20L, service.transferHost(roomId, 20L).ownerId());
        assertThrows(ForbiddenException.class, () -> service.regenerateCode(roomId));
        assertThrows(ForbiddenException.class, () -> service.timer(roomId,
                new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.START)));
        service.leave(roomId);
        verify(rooms, never()).delete(any());
    }

    @Test
    void rotationChangesCodeAndRequiresHost() {
        asHost();
        assertNotEquals("ABCDEFGHJK", service.regenerateCode(roomId).inviteCode());
        when(current.getCurrentUserId()).thenReturn(20L);
        assertThrows(ForbiddenException.class, () -> service.regenerateCode(roomId));
        assertThrows(ForbiddenException.class, () -> service.transferHost(roomId, 20L));
    }

    @Test
    void transferRequiresExistingMemberAndFullRoomRejectsJoin() {
        asHost();
        assertThrows(com.example.studystreak.exceptions.ConflictException.class,
                () -> service.transferHost(roomId, 99L));
        when(current.getCurrentUserId()).thenReturn(20L);
        when(rooms.findByCodeForUpdate("ABCDEFGHJK")).thenReturn(Optional.of(room));
        when(members.countByRoomId(roomId)).thenReturn(12L);
        assertThrows(com.example.studystreak.exceptions.ConflictException.class,
                () -> service.join(new StudyRoomJoinRequest("ABCDEFGHJK")));
    }

    @Test
    void repeatedInvalidInvitesAreThrottled() {
        when(current.getCurrentUserId()).thenReturn(20L);
        for (int i = 0; i < 20; i++)
            assertThrows(com.example.studystreak.exceptions.ResourceNotFoundException.class,
                    () -> service.join(new StudyRoomJoinRequest("bad")));
        var error = assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.join(new StudyRoomJoinRequest("bad")));
        assertEquals(429, error.getStatusCode().value());
    }
}
