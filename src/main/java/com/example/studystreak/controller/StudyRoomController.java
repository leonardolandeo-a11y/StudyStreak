package com.example.studystreak.controller;

import com.example.studystreak.dto.Room.*;
import com.example.studystreak.service.StudyRoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/study-rooms")
public class StudyRoomController {
    private final StudyRoomService service;

    public StudyRoomController(StudyRoomService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudyRoomSnapshot> mine() { return service.mine(); }

    @PostMapping
    public ResponseEntity<StudyRoomSnapshot> create(@Valid @RequestBody StudyRoomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PostMapping("/join")
    public StudyRoomSnapshot join(@Valid @RequestBody StudyRoomJoinRequest request) {
        return service.join(request);
    }

    @GetMapping("/{id}")
    public StudyRoomSnapshot get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping("/{id}/heartbeat")
    public StudyRoomSnapshot heartbeat(@PathVariable UUID id, @Valid @RequestBody StudyRoomHeartbeat request) {
        return service.heartbeat(id, request);
    }

    @PostMapping("/{id}/timer")
    public StudyRoomSnapshot timer(@PathVariable UUID id, @Valid @RequestBody StudyRoomTimerRequest request) {
        return service.timer(id, request);
    }

    @PostMapping("/{id}/invitation")
    public StudyRoomSnapshot regenerateCode(@PathVariable UUID id) { return service.regenerateCode(id); }

    @PostMapping("/{id}/host")
    public StudyRoomSnapshot transferHost(@PathVariable UUID id, @Valid @RequestBody StudyRoomHostRequest request) {
        return service.transferHost(id, request.userId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> leave(@PathVariable UUID id) {
        service.leave(id);
        return ResponseEntity.noContent().build();
    }
}
