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

    private final CurrentUserService currentUser;
    private final StudyRoomRepository rooms;
    private final StudyRoomMemberRepository members;

    public StudyRoomService(CurrentUserService currentUser, StudyRoomRepository rooms,
                            StudyRoomMemberRepository members) {
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
                ? Math.max(0, Duration.between(now, room.getEndsAt()).toSeconds() + 1)
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
                room.getEndsAt(), now, participants);
    }

    @Transactional
    public StudyRoomSnapshot create(StudyRoomRequest request) {
        User user = currentUser.getCurrentUser();
        Instant now = Instant.now();
        StudyRoom room = rooms.save(new StudyRoom(UUID.randomUUID(), inviteCode(),
                request.name().trim(), user, now));
        members.save(new StudyRoomMember(room, user, now));
        return snapshot(room, user.getId(), now);
    }

    @Transactional
    public StudyRoomSnapshot join(StudyRoomJoinRequest request) {
        Long userId = currentUser.getCurrentUserId();
        String code = request.code().strip().toUpperCase(Locale.ROOT);
        if (!code.matches("[A-HJ-NP-Z2-9]{10}")) {
            throw new ResourceNotFoundException("No room found for that invitation code");
        }
        StudyRoom room = rooms.findByInviteCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("No room found for that invitation code"));
        // Lock the room before checking capacity to serialize concurrent joins.
        room = rooms.findByIdForUpdate(room.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Study room closed"));
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
        StudyRoom room = ownedRoom(roomId, userId);
        StudyRoomMember member = members.findByRoomIdAndUserId(roomId, userId).orElseThrow();
        member.setStudying(request.studying());
        member.setLastSeenAt(Instant.now());
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
        Instant now = Instant.now();
        int remaining = "RUNNING".equals(room.getTimerStatus()) && room.getEndsAt() != null
                ? (int) Math.max(0, Duration.between(now, room.getEndsAt()).toSeconds() + 1)
                : room.getRemainingSeconds();
        switch (request.action()) {
            case START -> {
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
        rooms.save(room);
        return snapshot(room, userId, now);
    }

    @Transactional
    public void leave(UUID roomId) {
        long userId = currentUser.getCurrentUserId();
        StudyRoom room = ownedRoom(roomId, userId);
        if (room.getOwner().getId().equals(userId)) {
            members.deleteByRoomId(roomId);
            rooms.delete(room);
        } else {
            StudyRoomMember membership = members.findByRoomIdAndUserId(roomId, userId).orElseThrow();
            members.delete(membership);
        }
    }
}
