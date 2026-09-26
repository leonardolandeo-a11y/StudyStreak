package com.example.studystreak.service;

import com.example.studystreak.dto.DailyRecord.DailyRecordRequestDTO;
import com.example.studystreak.dto.DailyRecord.DailyRecordResponseDTO;
import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.Goal;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.GoalRepository;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.studystreak.exceptions.ForbiddenException;

@Service
public class DailyRecordService {

    private final DailyRecordRepository dailyRecordRepository;
    private final ModelMapper modelMapper;
    private final GoalRepository goalRepository;
    private final CurrentUserService currentUserService;

    public DailyRecordService(DailyRecordRepository dailyRecordRepository, ModelMapper modelMapper,
            GoalRepository goalRepository, CurrentUserService currentUserService) {

        this.dailyRecordRepository = dailyRecordRepository;
        this.modelMapper = modelMapper;
        this.goalRepository = goalRepository;
        this.currentUserService = currentUserService;
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


    public DailyRecordResponseDTO createDailyRecord(Long goalId, DailyRecordRequestDTO dailyRecordRequest) {

        Goal goal = getOwnedGoal(goalId);

        boolean alreadyExists = dailyRecordRepository.existsByGoalIdAndDate(goalId, dailyRecordRequest.getDate());

        if (alreadyExists) {
            throw new ConflictException("A daily record already exists for this goal on "
                        + dailyRecordRequest.getDate());
        }


        DailyRecord dailyRecord = modelMapper.map(dailyRecordRequest, DailyRecord.class);
        dailyRecord.setGoal(goal);
        DailyRecord savedRecord = dailyRecordRepository.save(dailyRecord);

        return modelMapper.map(savedRecord, DailyRecordResponseDTO.class);
    }

    public Page<DailyRecordResponseDTO> getGoalDailyRecords(Long goalId, Pageable pageable) {

        getOwnedGoal(goalId);

        return dailyRecordRepository.findByGoalId(goalId, pageable)
                .map(record -> modelMapper.map(record, DailyRecordResponseDTO.class));
    }

    public DailyRecordResponseDTO getDailyRecordById(Long goalId, Long dailyRecordId) {

        DailyRecord dailyRecord = getOwnedDailyRecord(goalId, dailyRecordId);
        return modelMapper.map(dailyRecord, DailyRecordResponseDTO.class);
    }

    public DailyRecordResponseDTO updateDailyRecord(Long goalId, Long dailyRecordId,
                                                    DailyRecordRequestDTO dailyRecordRequest) {

        DailyRecord dailyRecord = getOwnedDailyRecord(goalId, dailyRecordId);
        boolean duplicatedDate = dailyRecordRepository
                        .existsByGoalIdAndDateAndIdNot(goalId, dailyRecordRequest.getDate(), dailyRecordId);

        if (duplicatedDate) {
            throw new ConflictException(
                    "A daily record already exists for this goal on " + dailyRecordRequest.getDate());
        }

        dailyRecord.setDate(dailyRecordRequest.getDate());
        dailyRecord.setNote(dailyRecordRequest.getNote());
        dailyRecord.setEvidence(dailyRecordRequest.getEvidence());

        DailyRecord updatedRecord = dailyRecordRepository.save(dailyRecord);

        return modelMapper.map(updatedRecord, DailyRecordResponseDTO.class);
    }

    public void deleteDailyRecord(Long goalId, Long dailyRecordId) {

        DailyRecord dailyRecord = getOwnedDailyRecord(goalId, dailyRecordId);
        dailyRecordRepository.delete(dailyRecord);
    }
}