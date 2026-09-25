package com.example.studystreak.controller;

import com.example.studystreak.dto.DailyRecord.DailyRecordDTO;
import com.example.studystreak.service.DailyRecordService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<DailyRecordDTO> createDailyRecord(
            @PathVariable Long goalId,
            @RequestBody DailyRecordDTO dailyRecordDTO){

        DailyRecordDTO response = dailyRecordService.createDailyRecord(goalId, dailyRecordDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/goals/{goalId}/daily-records")
    public ResponseEntity<List<DailyRecordDTO>> getGoalDailyRecords(@PathVariable Long goalId){

        List<DailyRecordDTO> response = dailyRecordService.getGoalDailyRecords(goalId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/daily-records/{dailyRecordId}")
    public ResponseEntity<DailyRecordDTO> updateDailyRecord(@PathVariable Long dailyRecordId, @RequestBody DailyRecordDTO dailyRecordDTO){

        DailyRecordDTO response = dailyRecordService.updateDailyRecord(dailyRecordId, dailyRecordDTO);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/daily-records/{dailyRecordId}")
    public ResponseEntity<Void> deleteDailyRecord(@PathVariable Long dailyRecordId){

        dailyRecordService.deleteDailyRecord(dailyRecordId);

        return ResponseEntity.noContent().build();
    }
}