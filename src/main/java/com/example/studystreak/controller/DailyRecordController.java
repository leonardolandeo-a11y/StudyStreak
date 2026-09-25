package com.example.studystreak.controller;

import com.example.studystreak.dto.DailyRecord.DailyRecordRequestDTO;
import com.example.studystreak.dto.DailyRecord.DailyRecordResponseDTO;
import com.example.studystreak.service.DailyRecordService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals/{goalId}/daily-records")
public class DailyRecordController {

    private final DailyRecordService dailyRecordService;

    public DailyRecordController(DailyRecordService dailyRecordService) {

        this.dailyRecordService = dailyRecordService;
    }

    @PostMapping
    public ResponseEntity<DailyRecordResponseDTO> createDailyRecord(@PathVariable Long goalId,
            @RequestBody DailyRecordRequestDTO dailyRecordRequest) {

        DailyRecordResponseDTO savedRecord = dailyRecordService.createDailyRecord(goalId, dailyRecordRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedRecord);
    }

    @GetMapping
    public ResponseEntity<List<DailyRecordResponseDTO>>
    getGoalDailyRecords(@PathVariable Long goalId) {

        List<DailyRecordResponseDTO> records = dailyRecordService.getGoalDailyRecords(goalId);

        return ResponseEntity.ok(records);
    }

    @GetMapping("/{dailyRecordId}")
    public ResponseEntity<DailyRecordResponseDTO> getDailyRecord(@PathVariable Long dailyRecordId) {

        DailyRecordResponseDTO record = dailyRecordService.getDailyRecordById(dailyRecordId);

        return ResponseEntity.ok(record);
    }

    @PutMapping("/{dailyRecordId}")
    public ResponseEntity<DailyRecordResponseDTO> updateDailyRecord(@PathVariable Long dailyRecordId,
                                                                    @RequestBody DailyRecordRequestDTO dailyRecordRequest
    ) {
        DailyRecordResponseDTO updatedRecord = dailyRecordService.updateDailyRecord(dailyRecordId, dailyRecordRequest);

        return ResponseEntity.ok(updatedRecord);
    }

    @DeleteMapping("/{dailyRecordId}")
    public ResponseEntity<Void> deleteDailyRecord(@PathVariable Long dailyRecordId) {

        dailyRecordService.deleteDailyRecord(dailyRecordId);
        return ResponseEntity.noContent().build();
    }
}