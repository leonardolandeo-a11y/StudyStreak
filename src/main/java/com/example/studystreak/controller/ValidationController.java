package com.example.studystreak.controller;

import com.example.studystreak.dto.Validation.ValidationRequestDTO;
import com.example.studystreak.dto.Validation.ValidationResponseDTO;
import com.example.studystreak.service.ValidationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals/{goalId}/daily-records/{dailyRecordId}/validation")
public class ValidationController {

    private final ValidationService validationService;

    public ValidationController(ValidationService validationService) {

        this.validationService = validationService;
    }

    @PostMapping
    public ResponseEntity<ValidationResponseDTO> createValidation(@PathVariable Long dailyRecordId,
            @RequestHeader("X-User-Id") Long validatorId,
            @RequestBody ValidationRequestDTO validationRequest) {

        ValidationResponseDTO savedValidation =
                validationService.createValidation(dailyRecordId, validatorId, validationRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedValidation);
    }

    @GetMapping
    public ResponseEntity<ValidationResponseDTO> getDailyRecordValidation(@PathVariable Long dailyRecordId) {

        ValidationResponseDTO validation = validationService.getDailyRecordValidation(dailyRecordId);
        return ResponseEntity.ok(validation);
    }

    @PutMapping
    public ResponseEntity<ValidationResponseDTO> updateValidation(@PathVariable Long dailyRecordId,
            @RequestBody ValidationRequestDTO validationRequest) {

        ValidationResponseDTO updatedValidation =
                validationService.updateValidation(
                        dailyRecordId,
                        validationRequest
                );

        return ResponseEntity.ok(updatedValidation);
    }
}