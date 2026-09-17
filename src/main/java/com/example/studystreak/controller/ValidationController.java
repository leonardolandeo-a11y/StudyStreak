package com.example.studystreak.controller;

import com.example.studystreak.dto.Validation.ValidationDTO;
import com.example.studystreak.service.ValidationService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ValidationController {
    private final ValidationService validationService;

    public ValidationController(ValidationService validationService) {
        this.validationService = validationService;
    }

    @PostMapping("/daily-records/{dailyRecordId}/validation")
    public ValidationDTO createValidation(@PathVariable Long dailyRecordId, @RequestHeader("X-User-Id") Long validatorId, @RequestBody ValidationDTO validationDTO) {
        return validationService.createValidation(dailyRecordId, validatorId, validationDTO);
    }

    @GetMapping("/daily-records/{dailyRecordId}/validation")
    public ValidationDTO getDailyRecordValidation(@PathVariable Long dailyRecordId) {
        return validationService.getDailyRecordValidation(dailyRecordId);
    }

    @PutMapping("/validations/{validationId}")
    public ValidationDTO updateValidation(@PathVariable Long validationId, @RequestBody ValidationDTO validationDTO) {
        return validationService.updateValidation(validationId, validationDTO);
    }
}