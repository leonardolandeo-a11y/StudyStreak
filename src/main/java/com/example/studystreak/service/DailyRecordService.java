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

import java.util.List;

@Service
public class DailyRecordService {

    private final DailyRecordRepository dailyRecordRepository;
    private final ModelMapper modelMapper;
    private final GoalRepository goalRepository;

    public DailyRecordService(DailyRecordRepository dailyRecordRepository, ModelMapper modelMapper,
            GoalRepository goalRepository) {

        this.dailyRecordRepository = dailyRecordRepository;
        this.modelMapper = modelMapper;
        this.goalRepository = goalRepository;
    }

    public DailyRecordResponseDTO createDailyRecord(Long goalId, DailyRecordRequestDTO dailyRecordRequest) {

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));

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

        return dailyRecordRepository.findByGoalId(goalId, pageable)
                .map(record -> modelMapper.map(record, DailyRecordResponseDTO.class));
    }

    public DailyRecordResponseDTO getDailyRecordById(Long dailyRecordId) {

        DailyRecord dailyRecord = dailyRecordRepository.findById(dailyRecordId)
                .orElseThrow(() -> new ResourceNotFoundException("DailyRecord not found with id: " + dailyRecordId));

        return modelMapper.map(dailyRecord, DailyRecordResponseDTO.class);
    }

    public DailyRecordResponseDTO updateDailyRecord(Long dailyRecordId, DailyRecordRequestDTO dailyRecordRequest) {

        DailyRecord dailyRecord = dailyRecordRepository.findById(dailyRecordId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "DailyRecord not found with id: " + dailyRecordId));

        Long goalId = dailyRecord.getGoal().getId();
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

    public void deleteDailyRecord(Long dailyRecordId) {

        DailyRecord dailyRecord = dailyRecordRepository.findById(dailyRecordId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                        "DailyRecord not found with id: " + dailyRecordId));

        dailyRecordRepository.delete(dailyRecord);
    }
}