package com.example.studystreak.controller;

import com.example.studystreak.dto.Validation.ValidationRequestDTO;
import com.example.studystreak.dto.Validation.ValidationResponseDTO;
import com.example.studystreak.service.CurrentUserService;
import com.example.studystreak.service.ValidationService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(
        "/api/goals/{goalId}/daily-records/{dailyRecordId}/validation"
)
public class ValidationController {

    private final ValidationService validationService;
    private final CurrentUserService currentUserService;

    public ValidationController(
            ValidationService validationService,
            CurrentUserService currentUserService
    ) {
        this.validationService = validationService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public ResponseEntity<ValidationResponseDTO> createValidation(
            @PathVariable Long goalId,
            @PathVariable Long dailyRecordId,
            @RequestBody ValidationRequestDTO validationRequest
    ) {

        Long validatorId =
                currentUserService.getCurrentUserId();

        ValidationResponseDTO validation =
                validationService.createValidation(
                        dailyRecordId,
                        validatorId,
                        validationRequest
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(validation);
    }

    @GetMapping
    public ResponseEntity<ValidationResponseDTO>
    getDailyRecordValidation(
            @PathVariable Long goalId,
            @PathVariable Long dailyRecordId
    ) {

        return ResponseEntity.ok(
                validationService
                        .getDailyRecordValidation(dailyRecordId)
        );
    }

    @PutMapping
    public ResponseEntity<ValidationResponseDTO> updateValidation(
            @PathVariable Long goalId,
            @PathVariable Long dailyRecordId,
            @RequestBody ValidationRequestDTO validationRequest
    ) {

        return ResponseEntity.ok(
                validationService.updateValidation(
                        dailyRecordId,
                        validationRequest
                )
        );
    }
}