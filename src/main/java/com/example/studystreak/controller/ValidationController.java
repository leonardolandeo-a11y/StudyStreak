package com.example.studystreak.controller;

import com.example.studystreak.dto.Validation.ValidationDTO;
import com.example.studystreak.service.ValidationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ValidationController {

    private final ValidationService validationService;

    public ValidationController(ValidationService validationService) {
        this.validationService = validationService;
    }

    @PostMapping("/daily-records/{dailyRecordId}/validation")
    public ResponseEntity<ValidationDTO> createValidation(
            @PathVariable Long dailyRecordId,
            @RequestHeader("X-User-Id") Long validatorId,
            @RequestBody ValidationDTO validationDTO) {

        ValidationDTO createdValidation = validationService.createValidation(
                        dailyRecordId,
                        validatorId,
                        validationDTO
                );

        return ResponseEntity.status(HttpStatus.CREATED).body(createdValidation);
    }

    @GetMapping("/daily-records/{dailyRecordId}/validation")
    public ResponseEntity<ValidationDTO> getDailyRecordValidation(@PathVariable Long dailyRecordId) {

        ValidationDTO validation = validationService.getDailyRecordValidation(dailyRecordId);

        return ResponseEntity.ok(validation);
    }

    @PutMapping("/validations/{validationId}")
    public ResponseEntity<ValidationDTO> updateValidation(
            @PathVariable Long validationId,
            @RequestBody ValidationDTO validationDTO) {

        ValidationDTO updatedValidation = validationService.updateValidation(
                        validationId,
                        validationDTO
                );

        return ResponseEntity.ok(updatedValidation);
    }
}