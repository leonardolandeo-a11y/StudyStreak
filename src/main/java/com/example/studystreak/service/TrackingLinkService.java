package com.example.studystreak.service;

import com.example.studystreak.dto.TrackingLink.TrackingLinkDTO;
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
            throw new RuntimeException();
        }

        User requester = userRepository.findById(requesterId).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow();

        if (trackingLinkRepository.findLinkBetweenUsers(requesterId, receiverId).isPresent()) {
            throw new RuntimeException();
        }

        TrackingLink trackingLink = new TrackingLink(requester, receiver, TrackingStatus.PENDING);

        //por motivos de seguridad seteeamos obligatoriamente el status a PENDING
        trackingLink.setStatus(TrackingStatus.PENDING);

        TrackingLink savedtrackingLink = trackingLinkRepository.save(trackingLink);
        return modelMapper.map(savedtrackingLink, TrackingLinkDTO.class);
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
        TrackingLink trackingLink = trackingLinkRepository.findById(trackingId).orElseThrow();

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
        // Se ha actualizado el repository para agregar el query method findlinkbetweenusers
        TrackingLink link = trackingLinkRepository.findLinkBetweenUsers(currentUserId, otherUserId).orElseThrow();

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
        List<TrackingLink> trackingLinks = trackingLinkRepository.findLinksByUserIdAndStatus(userId, TrackingStatus.ACCEPTED);

        List<TrackingLinkDTO> trackingDTOs = new ArrayList<>();

        for (TrackingLink trackingLink : trackingLinks) {
            trackingDTOs.add(modelMapper.map(trackingLink, TrackingLinkDTO.class));
        }

        return trackingDTOs;
    }

    public TrackingLinkDTO updateTrackingStatus(Long trackingId, TrackingLinkDTO trackingLinkDTO, Long receiverId) {
        TrackingLink trackingLink = trackingLinkRepository.findById(trackingId).orElseThrow();

        if (!trackingLink.getReceiver().getId().equals(receiverId) || trackingLink.getStatus() != TrackingStatus.PENDING || trackingLinkDTO.getStatus() == TrackingStatus.PENDING) {
            throw new RuntimeException();
        }

        trackingLink.setStatus(trackingLinkDTO.getStatus());

        TrackingLink updatedtrackingLink = trackingLinkRepository.save(trackingLink);

        return modelMapper.map(updatedtrackingLink, TrackingLinkDTO.class);
    }

    public void deleteTrackingLink(Long trackingId, Long userId) {
        TrackingLink trackingLink = trackingLinkRepository.findById(trackingId).orElseThrow();

        if (!trackingLink.getRequester().getId().equals(userId) && !trackingLink.getReceiver().getId().equals(userId)) {
            throw new RuntimeException();
        }

        trackingLinkRepository.delete(trackingLink);
    }
}