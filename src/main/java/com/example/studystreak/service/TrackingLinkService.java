package com.example.studystreak.service;

import com.example.studystreak.dto.TrackingLink.TrackingLinkResponseDTO;
import com.example.studystreak.dto.TrackingLink.TrackingLinkStatusRequestDTO;
import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.TrackingStatus;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TrackingLinkService {

    private final TrackingLinkRepository trackingLinkRepository;
    private final UserRepository userRepository;

    public TrackingLinkService(TrackingLinkRepository trackingLinkRepository, UserRepository userRepository) {

        this.trackingLinkRepository = trackingLinkRepository;
        this.userRepository = userRepository;
    }

    public TrackingLinkResponseDTO createTrackingLink(Long requesterId, Long receiverId) {

        if (requesterId.equals(receiverId)) {
            throw new ConflictException("A user cannot create a tracking link with themselves");
        }

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException(
                                "User not found with id: " + requesterId)
                );

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException(
                                "User not found with id: " + receiverId)
                );

        if (trackingLinkRepository.findLinkBetweenUsers(requesterId, receiverId).isPresent()) {

            throw new ConflictException("A tracking link between users " + requesterId + " and "
                            + receiverId + " already exists"
            );
        }

        TrackingLink trackingLink = new TrackingLink(requester, receiver, TrackingStatus.PENDING);
        TrackingLink savedTrackingLink = trackingLinkRepository.save(trackingLink);

        return toResponse(savedTrackingLink);
    }

    public List<TrackingLinkResponseDTO> getTrackingLinksByUserId(
            Long userId
    ) {
        return trackingLinkRepository.findLinksByUserId(userId).stream()
                .map(this::toResponse).toList();
    }

    public TrackingLinkResponseDTO getLinkBetweenUsers(Long currentUserId, Long otherUserId) {

        TrackingLink trackingLink = trackingLinkRepository.findLinkBetweenUsers(currentUserId, otherUserId)
                        .orElseThrow(() -> new ResourceNotFoundException("Tracking link not found between users "
                                                + currentUserId
                                                + " and "
                                                + otherUserId
                                )
                        );
        return toResponse(trackingLink);
    }

    public List<TrackingLinkResponseDTO>
    getPendingReceivedInvitations(Long userId) {

        return trackingLinkRepository
                .findByReceiverIdAndStatus(userId, TrackingStatus.PENDING).stream()
                .map(this::toResponse).toList();
    }

    public List<TrackingLinkResponseDTO> getActiveTrackingList(Long userId) {

        return trackingLinkRepository
                .findLinksByUserIdAndStatus(userId, TrackingStatus.ACCEPTED).stream()
                .map(this::toResponse).toList();
    }

    public TrackingLinkResponseDTO updateTrackingStatus(
            Long trackingId,
            TrackingLinkStatusRequestDTO trackingRequest,
            Long receiverId
    ) {

        TrackingLink trackingLink =
                trackingLinkRepository.findById(trackingId)
                        .orElseThrow(() -> new ResourceNotFoundException("Tracking link not found with id: "
                                                + trackingId)
                        );

        if (!trackingLink
                .getReceiver()
                .getId()
                .equals(receiverId)) {

            throw new ForbiddenException(
                    "User with id: " + receiverId + " cannot update tracking link with id: " + trackingId
            );
        }

        if (trackingLink.getStatus() != TrackingStatus.PENDING) {
            throw new ConflictException(
                    "Tracking link with id: " + trackingId + " has already been processed"
            );
        }

        if (trackingRequest.getStatus() == null) {
            throw new IllegalArgumentException(
                    "Tracking status is required"
            );
        }

        if (trackingRequest.getStatus() == TrackingStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Tracking status must be ACCEPTED or REJECTED"
            );
        }

        trackingLink.setStatus(trackingRequest.getStatus());
        TrackingLink updatedTrackingLink = trackingLinkRepository.save(trackingLink);
        return toResponse(updatedTrackingLink);
    }

    public void deleteTrackingLink(
            Long trackingId,
            Long userId
    ) {

        TrackingLink trackingLink =
                trackingLinkRepository.findById(trackingId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Tracking link not found with id: "
                                                + trackingId
                                )
                        );


        if (!trackingLink.getRequester().getId().equals(userId)
                && !trackingLink.getReceiver().getId().equals(userId)) {

            throw new ForbiddenException(
                    "User with id: "
                            + userId
                            + " cannot delete tracking link with id: "
                            + trackingId
            );
        }

        trackingLinkRepository.delete(trackingLink);
    }

    private TrackingLinkResponseDTO toResponse(
            TrackingLink trackingLink
    ) {

        TrackingLinkResponseDTO response =
                new TrackingLinkResponseDTO();

        response.setId(trackingLink.getId());

        response.setRequesterId(
                trackingLink.getRequester().getId()
        );

        response.setReceiverId(
                trackingLink.getReceiver().getId()
        );

        response.setStatus(
                trackingLink.getStatus()
        );

        return response;
    }
}