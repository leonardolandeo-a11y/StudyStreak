package com.example.studystreak.controller;

import com.example.studystreak.dto.DailyRecord.DailyRecordRequestDTO;
import com.example.studystreak.dto.DailyRecord.DailyRecordResponseDTO;
import com.example.studystreak.service.DailyRecordService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    public ResponseEntity<Page<DailyRecordResponseDTO>>
    getGoalDailyRecords(@PathVariable Long goalId, Pageable pageable) {

        return ResponseEntity.ok(
                dailyRecordService.getGoalDailyRecords(goalId, pageable));
    }

    @GetMapping("/{dailyRecordId}")
    public ResponseEntity<DailyRecordResponseDTO> getDailyRecords(@PathVariable Long dailyRecordId) {

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