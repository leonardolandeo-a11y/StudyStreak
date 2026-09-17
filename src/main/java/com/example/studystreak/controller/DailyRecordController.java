package com.example.studystreak.controller;

import com.example.studystreak.dto.DailyRecord.DailyRecordDTO;
import com.example.studystreak.service.DailyRecordService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DailyRecordController {
    private final DailyRecordService dailyRecordService;

    public DailyRecordController(DailyRecordService dailyRecordService){
        this.dailyRecordService = dailyRecordService;
    }

    @PostMapping("/goals/{goalId}/daily-records")
    public DailyRecordDTO createDailyRecord(@PathVariable Long goalId, @RequestBody DailyRecordDTO dailyRecordDTO){
        return dailyRecordService.createDailyRecord(goalId, dailyRecordDTO);
    }

    @GetMapping("/goals/{goalId}/daily-records")
    public List<DailyRecordDTO> getGoalDailyRecords(@PathVariable Long goalId){
        return dailyRecordService.getGoalDailyRecords(goalId);
    }

    @PutMapping("/daily-records/{dailyRecordId}")
    public DailyRecordDTO updateDailyRecord(@PathVariable Long dailyRecordId, @RequestBody DailyRecordDTO dailyRecordDTO){
        return dailyRecordService.updateDailyRecord(dailyRecordId, dailyRecordDTO);
    }

    @DeleteMapping("/daily-records/{dailyRecordId}")
    public void deleteDailyRecord(@PathVariable Long dailyRecordId){
        dailyRecordService.deleteDailyRecord(dailyRecordId);
    }
}