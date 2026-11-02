package com.example.studystreak.service;

import com.example.studystreak.dto.DailyRecord.DailyRecordRequestDTO;
import com.example.studystreak.dto.DailyRecord.DailyRecordResponseDTO;
import com.example.studystreak.event.DailyRecordCreatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;
import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.Goal;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.DailyRecordPhotoRepository;
import com.example.studystreak.repository.DailyRecordVoiceRepository;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.NotificationRepository;
import com.example.studystreak.repository.ValidationRepository;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.TrackingStatus;
import com.example.studystreak.repository.TrackingLinkRepository;

import com.example.studystreak.exceptions.ForbiddenException;

@Service
public class DailyRecordService {

    private final DailyRecordRepository dailyRecordRepository;
    private final ModelMapper modelMapper;
    private final GoalRepository goalRepository;
    private final CurrentUserService currentUserService;
    private final TrackingLinkRepository trackingLinkRepository;
    private final DailyRecordPhotoRepository dailyRecordPhotoRepository;
    private final DailyRecordVoiceRepository dailyRecordVoiceRepository;
    private final NotificationRepository notificationRepository;
    private final ValidationRepository validationRepository;
    private final StreakService streakService;
    private final ApplicationEventPublisher eventPublisher;

    public DailyRecordService(DailyRecordRepository dailyRecordRepository,
                              ModelMapper modelMapper,
                              GoalRepository goalRepository,
                              CurrentUserService currentUserService,
                              TrackingLinkRepository trackingLinkRepository,
                              DailyRecordPhotoRepository dailyRecordPhotoRepository,
                              DailyRecordVoiceRepository dailyRecordVoiceRepository,
                              NotificationRepository notificationRepository,
                              ValidationRepository validationRepository,
                              StreakService streakService,
                              ApplicationEventPublisher eventPublisher) {

        this.dailyRecordRepository = dailyRecordRepository;
        this.modelMapper = modelMapper;
        this.goalRepository = goalRepository;
        this.currentUserService = currentUserService;
        this.trackingLinkRepository = trackingLinkRepository;
        this.dailyRecordPhotoRepository = dailyRecordPhotoRepository;
        this.dailyRecordVoiceRepository = dailyRecordVoiceRepository;
        this.notificationRepository = notificationRepository;
        this.validationRepository = validationRepository;
        this.streakService = streakService;
        this.eventPublisher = eventPublisher;
    }

    private Goal getOwnedGoal(Long goalId) {

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));

        Long currentUserId = currentUserService.getCurrentUserId();

        if (!goal.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You cannot access goal with id: " + goalId);
        }
        return goal;
    }
    private Goal getReadableGoal(Long goalId) {

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));

        Long currentUserId = currentUserService.getCurrentUserId();

        Long ownerUserId = goal.getUser().getId();

        // Owner can always read the goal
        if (currentUserId.equals(ownerUserId)) {
            return goal;
        }

        TrackingLink trackingLink = trackingLinkRepository
                        .findLinkBetweenUsers(currentUserId, ownerUserId)
                        .orElseThrow(() -> new ForbiddenException("You cannot access this user's daily records"));

        if (trackingLink.getStatus() != TrackingStatus.ACCEPTED) {
            throw new ForbiddenException("Tracking link must be accepted before accessing this user's daily records");
        }

        return goal;
    }

    private DailyRecord getOwnedDailyRecord(Long goalId, Long dailyRecordId) {

        getOwnedGoal(goalId);
        DailyRecord dailyRecord =
                dailyRecordRepository.findById(dailyRecordId)
                        .orElseThrow(() -> new ResourceNotFoundException("DailyRecord not found with id: " + dailyRecordId));

        if (!dailyRecord.getGoal().getId().equals(goalId)) {
            throw new ResourceNotFoundException(
                    "DailyRecord with id: "
                            + dailyRecordId
                            + " does not belong to goal: "
                            + goalId
            );
        }

        return dailyRecord;
    }
    private DailyRecord getReadableDailyRecord(Long goalId, Long dailyRecordId) {

        getReadableGoal(goalId);

        DailyRecord dailyRecord = dailyRecordRepository
                        .findById(dailyRecordId)
                        .orElseThrow(() -> new ResourceNotFoundException("DailyRecord not found with id: " + dailyRecordId));

        if (!dailyRecord.getGoal().getId().equals(goalId)) {

            throw new ResourceNotFoundException("DailyRecord with id: " + dailyRecordId + " does not belong to goal: " + goalId);
        }

        return dailyRecord;
    }

    // The record date is assigned by the server, never trusted from the client.
    private LocalDate currentStudyDate(Goal goal) {
        return StudyDatePolicy.today(goal.getUser());
    }

    @Transactional
    public DailyRecordResponseDTO createDailyRecord(Long goalId, DailyRecordRequestDTO dailyRecordRequest) {

        Goal goal = getOwnedGoal(goalId);

        LocalDate recordedDate = currentStudyDate(goal);
        boolean alreadyExists = dailyRecordRepository.existsByGoalIdAndDate(goalId, recordedDate);

        if (alreadyExists) {
            throw new ConflictException("A daily record already exists for this goal on " + recordedDate);
        }

        DailyRecord dailyRecord = modelMapper.map(dailyRecordRequest, DailyRecord.class);
        dailyRecord.setDate(recordedDate);
        dailyRecord.setGoal(goal);
        DailyRecord savedRecord = dailyRecordRepository.save(dailyRecord);
        DailyRecordResponseDTO response = toResponse(savedRecord);
        eventPublisher.publishEvent(new DailyRecordCreatedEvent(
                goal.getUser().getId(),
                goal.getUser().getUsername(),
                goal.getTopic(),
                goal.getId(),
                savedRecord.getId()
        ));
        return response;
    }

    public Page<DailyRecordResponseDTO> getGoalDailyRecords(Long goalId, Pageable pageable) {

        getReadableGoal(goalId);

        return dailyRecordRepository.findByGoalId(goalId, pageable)
                .map(this::toResponse);
    }

    public DailyRecordResponseDTO getDailyRecordById(Long goalId, Long dailyRecordId) {

        DailyRecord dailyRecord = getReadableDailyRecord(goalId, dailyRecordId);
        return toResponse(dailyRecord);
    }

    public DailyRecordResponseDTO updateDailyRecord(Long goalId, Long dailyRecordId,
                                                    DailyRecordRequestDTO dailyRecordRequest) {

        DailyRecord dailyRecord = getOwnedDailyRecord(goalId, dailyRecordId);
        // Editing notes/evidence is allowed, but moving a record to another date is not.
        if (dailyRecordRequest.getDate() != null
                && !dailyRecord.getDate().equals(dailyRecordRequest.getDate())) {
            throw new ConflictException("The date of an existing daily record cannot be changed.");
        }

        dailyRecord.setNote(dailyRecordRequest.getNote());
        dailyRecord.setEvidence(dailyRecordRequest.getEvidence());

        DailyRecord updatedRecord = dailyRecordRepository.save(dailyRecord);

        return toResponse(updatedRecord);
    }

    private DailyRecordResponseDTO toResponse(DailyRecord record) {
        DailyRecordResponseDTO response = modelMapper.map(record, DailyRecordResponseDTO.class);
        response.setOwnerUserId(record.getGoal().getUser().getId());
        response.setPhotoAvailable(dailyRecordPhotoRepository.existsByDailyRecordId(record.getId()));
        response.setVoiceAvailable(dailyRecordVoiceRepository.existsByDailyRecordId(record.getId()));
        return response;
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteDailyRecord(Long goalId, Long dailyRecordId) {

        DailyRecord dailyRecord = getOwnedDailyRecord(goalId, dailyRecordId);
        // Preserve notification history without links to a deleted record.
        notificationRepository.clearDeletedDailyRecordReferences(dailyRecordId);
        // Remove dependent rows before deleting the parent to satisfy foreign keys.
        dailyRecordPhotoRepository.deleteByDailyRecordId(dailyRecordId);
        dailyRecordVoiceRepository.deleteByDailyRecordId(dailyRecordId);
        validationRepository.deleteForDailyRecord(dailyRecordId);
        // Use a bulk delete so a previously loaded Validation cannot retain
        // a managed reference to a DailyRecord scheduled for entity removal.
        // The repository query clears the persistence context after execution.
        int deleted = dailyRecordRepository.deleteOwnedRecord(goalId, dailyRecordId);
        if (deleted != 1) {
            throw new ResourceNotFoundException("DailyRecord not found with id: " + dailyRecordId);
        }
        // A deleted approved record must no longer contribute to the goal streak.
        streakService.recalculateStreak(goalId);
    }
}
