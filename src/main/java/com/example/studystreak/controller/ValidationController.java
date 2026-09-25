package com.example.studystreak.controller;

import com.example.studystreak.dto.Validation.ValidationRequestDTO;
import com.example.studystreak.dto.Validation.ValidationResponseDTO;
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
    /*
     * Ya no necesitamos CurrentUserService aquí.
     */
    public ValidationController(ValidationService validationService) {

        this.validationService = validationService;
    }


    /*
     * POST
     *
     * Crea la Validation singular asociada
     * al DailyRecord indicado.
     *
     * El usuario que valida se obtiene automáticamente
     * desde SecurityContext dentro del service.
     */
    @PostMapping
    public ResponseEntity<ValidationResponseDTO>
    createValidation(
            @PathVariable Long goalId,
            @PathVariable Long dailyRecordId,
            @RequestBody ValidationRequestDTO validationRequest
    ) {

        ValidationResponseDTO validation = validationService.createValidation(goalId, dailyRecordId, validationRequest);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(validation);
    }


    /*
     * GET
     *
     * Obtiene la Validation asociada al DailyRecord.
     *
     * El service decide si el usuario autenticado
     * tiene permiso para verla.
     */
    @GetMapping
    public ResponseEntity<ValidationResponseDTO>
    getDailyRecordValidation(@PathVariable Long goalId, @PathVariable Long dailyRecordId) {

        return ResponseEntity.ok(
                validationService
                        .getDailyRecordValidation(
                                goalId,
                                dailyRecordId
                        )
        );
    }


    /*
     * PUT
     *
     * Actualiza la Validation existente.
     *
     * Solamente el validator original podrá hacerlo;
     * esta comprobación se realiza en ValidationService.
     */
    @PutMapping
    public ResponseEntity<ValidationResponseDTO>
    updateValidation(@PathVariable Long goalId, @PathVariable Long dailyRecordId,
            @RequestBody ValidationRequestDTO validationRequest
    ) {

        return ResponseEntity.ok(
                validationService.updateValidation(
                        goalId,
                        dailyRecordId,
                        validationRequest
                )
        );
    }
}