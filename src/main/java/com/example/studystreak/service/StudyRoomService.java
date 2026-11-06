package com.example.studystreak.service;

import com.example.studystreak.dto.Room.*;
import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.StudyRoom;
import com.example.studystreak.model.StudyRoomMember;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.StudyRoomMemberRepository;
import com.example.studystreak.repository.StudyRoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class StudyRoomService {
    private static final int MAX_MEMBERS = 12;
    private static final int FOCUS_SECONDS = 25 * 60;
    private static final int BREAK_SECONDS = 5 * 60;
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final java.util.Map<Long, long[]> attempts = new java.util.LinkedHashMap<>();

    private synchronized void checkInvitationRate(long userId) {
        long now = System.currentTimeMillis();
        attempts.entrySet().removeIf(entry -> now - entry.getValue()[0] >= 60_000);
        long[] window = attempts.get(userId);
        if (window == null) {
            if (attempts.size() >= 10_000)
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.TOO_MANY_REQUESTS, "Please retry in a minute");
            window = new long[]{now, 0};
            attempts.put(userId, window);
        }
        if (++window[1] > 20)
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.TOO_MANY_REQUESTS, "Too many invitations; retry in a minute");
    }

    private final com.example.studystreak.media.StudyMediaService media;
    private final StudyLedgerService ledger;
    private final CurrentUserService currentUser;
    private final StudyRoomRepository rooms;
    private final StudyRoomMemberRepository members;

    public StudyRoomService(CurrentUserService currentUser, StudyRoomRepository rooms,
                            StudyRoomMemberRepository members, StudyLedgerService ledger, com.example.studystreak.media.StudyMediaService media) {
        this.media = media;
        this.ledger = ledger;
        this.currentUser = currentUser;
        this.rooms = rooms;
        this.members = members;
    }

    private String inviteCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder code = new StringBuilder();
            for (int i = 0; i < 10; i++) {
                code.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            if (rooms.findByInviteCode(code.toString()).isEmpty()) return code.toString();
        }
        throw new ConflictException("Could not create a unique invitation; please retry");
    }

    private StudyRoom ownedRoom(UUID id, long userId) {
        StudyRoom room = rooms.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Study room not found"));
        if (members.findByRoomIdAndUserId(id, userId).isEmpty()) {
            throw new ForbiddenException("You are not a member of this private study room");
        }
        return room;
    }

    private StudyRoomSnapshot snapshot(StudyRoom room, long userId, Instant now) {
        boolean running = "RUNNING".equals(room.getTimerStatus());
        long remaining = running && room.getEndsAt() != null
                ? Math.max(0, (Duration.between(now, room.getEndsAt()).toMillis() + 999) / 1000)
                : room.getRemainingSeconds();
        String status = running && remaining == 0 ? "COMPLETE" : room.getTimerStatus();
        Instant cutoff = now.minusSeconds(35);
        List<StudyRoomSnapshot.Member> participants = new ArrayList<>();
        for (StudyRoomMember member : members.findByRoomId(room.getId())) {
            boolean online = !member.getLastSeenAt().isBefore(cutoff);
            participants.add(new StudyRoomSnapshot.Member(
                    member.getUser().getId(), member.getUser().getUsername(),
                    online, online && member.isStudying(), member.getUser().getId().equals(room.getOwner().getId())
            ));
        }
        return new StudyRoomSnapshot(room.getId(), room.getName(), room.getInviteCode(),
                room.getOwner().getId(), room.getOwner().getId().equals(userId),
                room.getPhase(), status, (int) Math.min(Integer.MAX_VALUE, remaining),
                room.getEndsAt(), now, room.getVersion(), participants);
    }

    @Transactional
    public StudyRoomSnapshot create(StudyRoomRequest request) {
        User user = currentUser.getCurrentUser();
        checkInvitationRate(user.getId());
        Instant now = Instant.now();
        StudyRoom room = rooms.save(new StudyRoom(UUID.randomUUID(), inviteCode(),
                request.name().trim(), user, now));
        members.save(new StudyRoomMember(room, user, now));
        return snapshot(room, user.getId(), now);
    }

    @Transactional
    public StudyRoomSnapshot join(StudyRoomJoinRequest request) {
        Long userId = currentUser.getCurrentUserId();
        checkInvitationRate(userId);
        String code = request.code().strip().toUpperCase(Locale.ROOT);
        if (!code.matches("[A-HJ-NP-Z2-9]{10}")) {
            throw new ResourceNotFoundException("No room found for that invitation code");
        }
        StudyRoom room = rooms.findByCodeForUpdate(code)
                .orElseThrow(() -> new ResourceNotFoundException("No room found for that invitation code"));
        media.assertNotBanned(room.getId(), userId);
        // Lookup and capacity checks share one lock, including code rotation and closure.
        if (members.findByRoomIdAndUserId(room.getId(), userId).isEmpty()) {
            if (members.countByRoomId(room.getId()) >= MAX_MEMBERS) {
                throw new ConflictException("This study room is full (12 members)");
            }
            members.save(new StudyRoomMember(room, currentUser.getCurrentUser(), Instant.now()));
        }
        return snapshot(room, userId, Instant.now());
    }

    @Transactional(readOnly = true)
    public List<StudyRoomSnapshot> mine() {
        long userId = currentUser.getCurrentUserId();
        Instant now = Instant.now();
        return members.findRoomsForUser(userId).stream()
                .map(room -> snapshot(room, userId, now)).toList();
    }

    @Transactional(readOnly = true)
    public StudyRoomSnapshot get(UUID roomId) {
        long userId = currentUser.getCurrentUserId();
        return snapshot(ownedRoom(roomId, userId), userId, Instant.now());
    }

    @Transactional
    public StudyRoomSnapshot heartbeat(UUID roomId, StudyRoomHeartbeat request) {
        long userId = currentUser.getCurrentUserId();
        StudyRoom room = lockedMemberRoom(roomId, userId);
        StudyRoomMember member = members.findByRoomIdAndUserId(roomId, userId).orElseThrow();
        if (request.studying() != null) member.setStudying(request.studying());
        member.setLastSeenAt(Instant.now());
        ledger.heartbeat(room, userId, member.isStudying());
        return snapshot(room, userId, Instant.now());
    }

    @Transactional
    public StudyRoomSnapshot timer(UUID roomId, StudyRoomTimerRequest request) {
        long userId = currentUser.getCurrentUserId();
        StudyRoom room = rooms.findByIdForUpdate(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Study room not found"));
        if (members.findByRoomIdAndUserId(roomId, userId).isEmpty()
                || !room.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("Only the study room host can control the shared timer");
        }
        if (request.expectedVersion() != null && !request.expectedVersion().equals(room.getVersion())) {
            throw new ConflictException("Room changed on another device. Refresh and try again.");
        }
        Instant now = Instant.now();
        int remaining = "RUNNING".equals(room.getTimerStatus()) && room.getEndsAt() != null
                ? (int) Math.max(0, (Duration.between(now, room.getEndsAt()).toMillis() + 999) / 1000)
                : room.getRemainingSeconds();
        if (request.action() == StudyRoomTimerRequest.Action.RESET || request.action() == StudyRoomTimerRequest.Action.FOCUS || request.action() == StudyRoomTimerRequest.Action.BREAK) ledger.cancelRuns(roomId);
        switch (request.action()) {
            case START -> {
                if ("RUNNING".equals(room.getTimerStatus()) && remaining > 0) break;
                int time = remaining > 0 ? remaining : "FOCUS".equals(room.getPhase()) ? FOCUS_SECONDS : BREAK_SECONDS;
                room.setRemainingSeconds(time);
                room.setEndsAt(now.plusSeconds(time));
                room.setTimerStatus("RUNNING");
            }
            case PAUSE -> {
                room.setRemainingSeconds(remaining);
                room.setEndsAt(null);
                room.setTimerStatus("PAUSED");
            }
            case RESET -> {
                room.setRemainingSeconds("FOCUS".equals(room.getPhase()) ? FOCUS_SECONDS : BREAK_SECONDS);
                room.setEndsAt(null);
                room.setTimerStatus("PAUSED");
            }
            case FOCUS, BREAK -> {
                room.setPhase(request.action().name());
                room.setRemainingSeconds(request.action() == StudyRoomTimerRequest.Action.FOCUS
                        ? FOCUS_SECONDS : BREAK_SECONDS);
                room.setEndsAt(null);
                room.setTimerStatus("PAUSED");
            }
        }
        rooms.saveAndFlush(room);
        ledger.roomTransition(room);
        return snapshot(room, userId, now);
    }

    private StudyRoom lockedMemberRoom(UUID id, long userId) {
        StudyRoom room = rooms.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Study room not found"));
        if (members.findByRoomIdAndUserId(id, userId).isEmpty())
            throw new ForbiddenException("You are not a member of this private study room");
        return room;
    }

    private StudyRoom lockedHostRoom(UUID id, long userId) {
        StudyRoom room = lockedMemberRoom(id, userId);
        if (!room.getOwner().getId().equals(userId))
            throw new ForbiddenException("Only the host can manage this room");
        return room;
    }

    @Transactional
    public StudyRoomSnapshot regenerateCode(UUID id) {
        long userId = currentUser.getCurrentUserId();
        checkInvitationRate(userId);
        StudyRoom room = lockedHostRoom(id, userId);
        room.setInviteCode(inviteCode());
        rooms.saveAndFlush(room);
        return snapshot(room, userId, Instant.now());
    }

    @Transactional
    public StudyRoomSnapshot transferHost(UUID id, Long nextHostId) {
        long userId = currentUser.getCurrentUserId();
        StudyRoom room = lockedHostRoom(id, userId);
        StudyRoomMember next = members.findByRoomIdAndUserId(id, nextHostId)
                .orElseThrow(() -> new ConflictException("New host must still be a member"));
        media.rotate(room);
        room.setOwner(next.getUser());
        rooms.saveAndFlush(room);
        return snapshot(room, userId, Instant.now());
    }

    @Transactional
    public void leave(UUID roomId) {
        long userId = currentUser.getCurrentUserId();
        StudyRoom room = lockedMemberRoom(roomId, userId);
        media.rotate(room);
        ledger.leave(roomId, userId);
        if (room.getOwner().getId().equals(userId)) {
            ledger.cancelRuns(roomId);
            members.deleteByRoomId(roomId);
            rooms.delete(room);
        } else {
            StudyRoomMember membership = members.findByRoomIdAndUserId(roomId, userId).orElseThrow();
            members.delete(membership);
        }
    }
}
