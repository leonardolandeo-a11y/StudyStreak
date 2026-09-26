package com.example.studystreak.controller;

import com.example.studystreak.dto.TrackingLink.TrackingLinkResponseDTO;
import com.example.studystreak.dto.TrackingLink.TrackingLinkStatusRequestDTO;
import com.example.studystreak.service.CurrentUserService;
import com.example.studystreak.service.TrackingLinkService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracking-links")
public class TrackingLinkController {

    private final TrackingLinkService trackingLinkService;
    private final CurrentUserService currentUserService;

    public TrackingLinkController(TrackingLinkService trackingLinkService, CurrentUserService currentUserService) {

        this.trackingLinkService = trackingLinkService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/{receiverId}")
    public ResponseEntity<TrackingLinkResponseDTO>
    createTrackingLink(@PathVariable Long receiverId) {

        Long requesterId = currentUserService.getCurrentUserId();
        TrackingLinkResponseDTO savedTrackingLink = trackingLinkService.createTrackingLink(requesterId, receiverId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedTrackingLink);
    }

    @GetMapping
    public ResponseEntity<Page<TrackingLinkResponseDTO>>
    getTrackingLinks(Pageable pageable) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(
                trackingLinkService.getTrackingLinksByUserId(userId, pageable)
        );
    }

    @GetMapping("/pending")
    public ResponseEntity<Page<TrackingLinkResponseDTO>>
    getPendingInvitations(Pageable pageable) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(
                trackingLinkService.getPendingReceivedInvitations(userId, pageable)
        );
    }

    @GetMapping("/active")
    public ResponseEntity<Page<TrackingLinkResponseDTO>> getActiveTrackingLinks(Pageable pageable) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(
                trackingLinkService.getActiveTrackingList(userId, pageable)
        );
    }

    @GetMapping("/with/{otherUserId}")
    public ResponseEntity<TrackingLinkResponseDTO>
    getLinkBetweenUsers(@PathVariable Long otherUserId) {

        Long currentUserId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(
                trackingLinkService.getLinkBetweenUsers(currentUserId, otherUserId)
        );
    }

    @PatchMapping("/{trackingId}/status")
    public ResponseEntity<TrackingLinkResponseDTO>
    updateTrackingStatus(@PathVariable Long trackingId, @Valid @RequestBody TrackingLinkStatusRequestDTO trackingRequest) {

        Long receiverId = currentUserService.getCurrentUserId();
        TrackingLinkResponseDTO updatedTrackingLink =
                trackingLinkService.updateTrackingStatus(trackingId, trackingRequest, receiverId);

        return ResponseEntity.ok(updatedTrackingLink);
    }

    @DeleteMapping("/{trackingId}")
    public ResponseEntity<Void> deleteTrackingLink(@PathVariable Long trackingId) {

        Long userId = currentUserService.getCurrentUserId();
        trackingLinkService.deleteTrackingLink(trackingId, userId);
        return ResponseEntity.noContent().build();
    }
}