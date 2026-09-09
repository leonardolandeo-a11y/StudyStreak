package com.example.studystreak.service;

import com.example.studystreak.dto.DailyRecord.DailyRecordDTO;
import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.Goal;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.GoalRepository;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DailyRecordService {
    private final DailyRecordRepository dailyRecordRepository;
    private final ModelMapper modelMapper;
    private final GoalRepository goalRepository;

    public DailyRecordService(DailyRecordRepository dailyRecordRepository, ModelMapper modelMapper, GoalRepository goalRepository){
        this.dailyRecordRepository = dailyRecordRepository;
        this.modelMapper = modelMapper;
        this.goalRepository = goalRepository;
    }

    public DailyRecordDTO createDailyRecord(Long goalId, DailyRecordDTO dailyRecordDTO){
        Goal goal = goalRepository.findById(goalId).orElseThrow(); // Exception (No implemented yet)
        DailyRecord dailyRecord = modelMapper.map(dailyRecordDTO, DailyRecord.class);
        dailyRecord.setGoal(goal);

        dailyRecord = dailyRecordRepository.save(dailyRecord);
        return modelMapper.map(dailyRecord,DailyRecordDTO.class);
    }

    public List<DailyRecordDTO> getGoalDailyRecords(Long goalId){
        List<DailyRecord> dailyRecords = dailyRecordRepository.findByGoalId(goalId);
        List<DailyRecordDTO> dailyRecordDTOS = new ArrayList<>();

        for (int i =0; i < dailyRecords.size(); i++){
            dailyRecordDTOS.add(modelMapper.map(dailyRecords.get(i), DailyRecordDTO.class));
        }
        return dailyRecordDTOS;

    }
    public DailyRecordDTO updateDailyRecord(Long dailyRecordId, DailyRecordDTO dailyRecordDTO){
        DailyRecord dailyRecord = dailyRecordRepository.findById(dailyRecordId).orElseThrow(); // Exception (Not implemented yet)
        dailyRecord.setDate(dailyRecordDTO.getDate());
        dailyRecord.setNote(dailyRecordDTO.getNote());
        dailyRecord.setEvidence(dailyRecordDTO.getEvidence());
        dailyRecordRepository.save(dailyRecord);
        return modelMapper.map(dailyRecord, DailyRecordDTO.class);
    }
    public void deleteDailyRecord(Long dailyRecordId){
        DailyRecord dailyRecord = dailyRecordRepository.findById(dailyRecordId).orElseThrow(); // Exception (Not implemented yet)
        dailyRecordRepository.delete(dailyRecord);
    }
}
