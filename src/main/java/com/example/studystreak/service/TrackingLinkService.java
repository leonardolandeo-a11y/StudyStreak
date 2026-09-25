package com.example.studystreak.service;

import com.example.studystreak.dto.TrackingLink.TrackingLinkResponseDTO;
import com.example.studystreak.dto.TrackingLink.TrackingLinkStatusRequestDTO;

import com.example.studystreak.event.TrackingLinkBrokenEvent;
import com.example.studystreak.event.TrackingLinkRequestedEvent;
import com.example.studystreak.event.TrackingLinkRespondedEvent;

import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;

import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.TrackingStatus;
import com.example.studystreak.model.User;

import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.UserRepository;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrackingLinkService {

    private final TrackingLinkRepository trackingLinkRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public TrackingLinkService(TrackingLinkRepository trackingLinkRepository, UserRepository userRepository, ApplicationEventPublisher eventPublisher) {
        this.trackingLinkRepository = trackingLinkRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }


    @Transactional
    public TrackingLinkResponseDTO createTrackingLink(Long requesterId, Long receiverId) {

        if (requesterId.equals(receiverId)) {
            throw new ConflictException("A user cannot create a tracking link with themselves");
        }

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found with id: " + requesterId)
                );

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found with id: " + receiverId)
                );

        if (trackingLinkRepository.findLinkBetweenUsers(requesterId, receiverId).isPresent()) {

            throw new ConflictException("A tracking link between users " + requesterId + " and " + receiverId + " already exists");
        }

        TrackingLink trackingLink = new TrackingLink(requester, receiver, TrackingStatus.PENDING);

        TrackingLink savedTrackingLink = trackingLinkRepository.save(trackingLink);

        /*
         * Publica el evento de solicitud.
         *
         * El listener con AFTER_COMMIT se ejecutará
         * solamente si esta transacción termina correctamente.
         */
        eventPublisher.publishEvent(
                new TrackingLinkRequestedEvent(
                        savedTrackingLink.getRequester().getId(),
                        savedTrackingLink.getReceiver().getId()
                )
        );
        return toResponse(savedTrackingLink);
    }


    public Page<TrackingLinkResponseDTO> getTrackingLinksByUserId(Long userId, Pageable pageable) {

        return trackingLinkRepository.findLinksByUserId(userId, pageable).map(this::toResponse);
    }


    public TrackingLinkResponseDTO getLinkBetweenUsers(Long currentUserId, Long otherUserId) {

        TrackingLink trackingLink = trackingLinkRepository.findLinkBetweenUsers(currentUserId, otherUserId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException("Tracking link not found between users " + currentUserId + " and " + otherUserId));

        return toResponse(trackingLink);
    }


    public Page<TrackingLinkResponseDTO> getPendingReceivedInvitations(Long userId, Pageable pageable) {

        return trackingLinkRepository.findByReceiverIdAndStatus(userId, TrackingStatus.PENDING, pageable).map(this::toResponse);
    }


    public Page<TrackingLinkResponseDTO> getActiveTrackingList(Long userId, Pageable pageable) {

        return trackingLinkRepository.findLinksByUserIdAndStatus(userId, TrackingStatus.ACCEPTED, pageable).map(this::toResponse);
    }


    @Transactional
    public TrackingLinkResponseDTO updateTrackingStatus(Long trackingId, TrackingLinkStatusRequestDTO trackingRequest, Long receiverId) {

        TrackingLink trackingLink = trackingLinkRepository.findById(trackingId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Tracking link not found with id: "
                                                + trackingId
                                )
                        );

        /*
         * Solo el receiver puede aceptar o rechazar
         * la solicitud.
         */
        if (!trackingLink.getReceiver().getId().equals(receiverId)) {

            throw new ForbiddenException("User with id: " + receiverId + " cannot update tracking link with id: " + trackingId);
        }

        /*
         * Una solicitud solo puede procesarse
         * mientras esté PENDING.
         */
        if (trackingLink.getStatus() != TrackingStatus.PENDING) {

            throw new ConflictException("Tracking link with id: " + trackingId + " has already been processed");
        }

        if (trackingRequest.getStatus() == null) {

            throw new IllegalArgumentException("Tracking status is required");
        }

        if (trackingRequest.getStatus() == TrackingStatus.PENDING) {

            throw new IllegalArgumentException("Tracking status must be ACCEPTED or REJECTED");
        }

        trackingLink.setStatus(trackingRequest.getStatus()
        );

        TrackingLink savedTrackingLink = trackingLinkRepository.save(trackingLink);

        /*
         * Publica el evento tanto para ACCEPTED
         * como para REJECTED.
         */
        eventPublisher.publishEvent(
                new TrackingLinkRespondedEvent(
                        savedTrackingLink.getRequester().getId(),
                        savedTrackingLink.getReceiver().getId(),
                        savedTrackingLink.getStatus()
                )
        );

        return toResponse(savedTrackingLink);
    }


    @Transactional
    public void deleteTrackingLink(Long trackingId, Long userId) {

        TrackingLink trackingLink = trackingLinkRepository.findById(trackingId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Tracking link not found with id: "
                                                + trackingId
                                )
                        );

        /*
         * Tanto requester como receiver pueden
         * romper/eliminar el tracking link.
         */
        if (!trackingLink.getRequester().getId().equals(userId) && !trackingLink.getReceiver().getId().equals(userId)) {

            throw new ForbiddenException("User with id: " + userId + " cannot delete tracking link with id: " + trackingId);
        }

        /*
         * Guardamos los IDs ANTES de eliminar
         * la entidad.
         */
        Long requesterId = trackingLink.getRequester().getId();

        Long receiverId = trackingLink.getReceiver().getId();

        trackingLinkRepository.delete(trackingLink);

        /*
         * Publicamos el evento después del delete.
         *
         * El listener AFTER_COMMIT no se ejecutará
         * hasta que el delete haya sido confirmado.
         */
        eventPublisher.publishEvent(
                new TrackingLinkBrokenEvent(
                        requesterId,
                        receiverId,
                        userId
                )
        );
    }


    private TrackingLinkResponseDTO toResponse(TrackingLink trackingLink) {

        TrackingLinkResponseDTO response = new TrackingLinkResponseDTO();

        response.setId(trackingLink.getId());

        response.setRequesterId(trackingLink.getRequester().getId());

        response.setReceiverId(trackingLink.getReceiver().getId());

        response.setStatus(trackingLink.getStatus());

        return response;
    }
}