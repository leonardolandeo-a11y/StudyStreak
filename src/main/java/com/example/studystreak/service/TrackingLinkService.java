package com.example.studystreak.service;

import com.example.studystreak.dto.TrackingLink.TrackingLinkDTO;
import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.TrackingStatus;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TrackingLinkService {

    private final TrackingLinkRepository trackingLinkRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Autowired
    public TrackingLinkService(TrackingLinkRepository trackingLinkRepository, UserRepository userRepository, ModelMapper modelMapper) {

        this.trackingLinkRepository = trackingLinkRepository;
        this.userRepository = userRepository;
        this.modelMapper = modelMapper;
    }

    public TrackingLinkDTO createTrackingLink(Long requesterId, Long receiverId) {

        if (requesterId.equals(receiverId)) {
            throw new ConflictException("A user cannot create a tracking link with themselves");
        }

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + requesterId));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + receiverId));

        if (trackingLinkRepository.findLinkBetweenUsers(requesterId, receiverId).isPresent()) {
            throw new ConflictException("A tracking link between users " + requesterId + " and " + receiverId + " already exists");
        }

        TrackingLink trackingLink = new TrackingLink(requester, receiver, TrackingStatus.PENDING);

        //por motivos de seguridad seteeamos obligatoriamente el status a PENDING
        trackingLink.setStatus(TrackingStatus.PENDING);

        TrackingLink savedTrackingLink = trackingLinkRepository.save(trackingLink);

        return modelMapper.map(savedTrackingLink, TrackingLinkDTO.class);
    }

    public List<TrackingLinkDTO> getAllTrackingLinks() {
        List<TrackingLink> trackingLinks = trackingLinkRepository.findAll();
        List<TrackingLinkDTO> trackingDTOs = new ArrayList<>();

        for (TrackingLink trackingLink : trackingLinks) {
            trackingDTOs.add(modelMapper.map(trackingLink, TrackingLinkDTO.class));
        }

        return trackingDTOs;
    }

    public TrackingLinkDTO getTrackingLinkById(Long trackingId) {
        TrackingLink trackingLink = trackingLinkRepository.findById(trackingId)
                .orElseThrow(() -> new ResourceNotFoundException("Tracking link not found with id: " + trackingId));

        return modelMapper.map(trackingLink, TrackingLinkDTO.class);
    }

    public List<TrackingLinkDTO> getTrackingLinksByUserId(Long userId) {
        List<TrackingLink> trackingLinks = trackingLinkRepository.findLinksByUserId(userId);
        List<TrackingLinkDTO> trackingDTOs = new ArrayList<>();

        for (TrackingLink trackingLink : trackingLinks) {
            trackingDTOs.add(modelMapper.map(trackingLink, TrackingLinkDTO.class));
        }

        return trackingDTOs;
    }

    public TrackingLinkDTO getLinkBetweenUsers(Long currentUserId, Long otherUserId) {
        TrackingLink link = trackingLinkRepository.findLinkBetweenUsers(currentUserId, otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Tracking link not found between users " + currentUserId + " and " + otherUserId));

        return modelMapper.map(link, TrackingLinkDTO.class);
    }

    public List<TrackingLinkDTO> getPendingReceivedInvitations(Long userId) {
        List<TrackingLink> trackingLinks = trackingLinkRepository.findByReceiverIdAndStatus(userId, TrackingStatus.PENDING);

        List<TrackingLinkDTO> trackingDTOs = new ArrayList<>();

        for (TrackingLink trackingLink : trackingLinks) {
            trackingDTOs.add(modelMapper.map(trackingLink, TrackingLinkDTO.class));
        }

        return trackingDTOs;
    }

    public List<TrackingLinkDTO> getActiveTrackingList(Long userId) {
        List<TrackingLink> trackingLinks =
                trackingLinkRepository.findLinksByUserIdAndStatus(userId, TrackingStatus.ACCEPTED);

        List<TrackingLinkDTO> trackingDTOs = new ArrayList<>();

        for (TrackingLink trackingLink : trackingLinks) {
            trackingDTOs.add(modelMapper.map(trackingLink, TrackingLinkDTO.class));
        }

        return trackingDTOs;
    }

    public TrackingLinkDTO updateTrackingStatus(Long trackingId, TrackingLinkDTO trackingLinkDTO, Long receiverId) {

        TrackingLink trackingLink = trackingLinkRepository.findById(trackingId)
                .orElseThrow(() -> new ResourceNotFoundException("Tracking link not found with id: " + trackingId));

        if (!trackingLink.getReceiver().getId().equals(receiverId)) {
            throw new ForbiddenException("User with id: " + receiverId + " cannot update tracking link with id: " + trackingId);
        }

        if (trackingLink.getStatus() != TrackingStatus.PENDING) {
            throw new ConflictException("Tracking link with id: " + trackingId + " has already been processed");
        }

        if (trackingLinkDTO.getStatus() == null) {
            throw new IllegalArgumentException("Tracking status is required");
        }

        if (trackingLinkDTO.getStatus() == TrackingStatus.PENDING) {
            throw new IllegalArgumentException("Tracking status must be ACCEPTED or REJECTED");
        }

        trackingLink.setStatus(trackingLinkDTO.getStatus());

        TrackingLink updatedTrackingLink = trackingLinkRepository.save(trackingLink);

        return modelMapper.map(updatedTrackingLink, TrackingLinkDTO.class);
    }

    public void deleteTrackingLink(Long trackingId, Long userId) {
        TrackingLink trackingLink = trackingLinkRepository.findById(trackingId)
                .orElseThrow(() -> new ResourceNotFoundException("Tracking link not found with id: " + trackingId));

        if (!trackingLink.getRequester().getId().equals(userId)
                && !trackingLink.getReceiver().getId().equals(userId)) {

            throw new ForbiddenException("User with id: " + userId + " cannot delete tracking link with id: " + trackingId);
        }

        trackingLinkRepository.delete(trackingLink);
    }
}