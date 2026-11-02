package com.example.studystreak.controller;

import com.example.studystreak.dto.Focus.FocusSessionRequestDTO;
import com.example.studystreak.dto.Focus.FocusSessionResponseDTO;
import com.example.studystreak.dto.Focus.FocusSummaryDTO;
import com.example.studystreak.service.FocusSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals/{goalId}/focus-sessions")
public class FocusSessionController {
    private final FocusSessionService service;

    public FocusSessionController(FocusSessionService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<FocusSessionResponseDTO> complete(
            @PathVariable Long goalId, @Valid @RequestBody FocusSessionRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.recordCompletion(goalId, request));
    }

    @GetMapping("/summary")
    public ResponseEntity<FocusSummaryDTO> summary(@PathVariable Long goalId) {
        return ResponseEntity.ok(service.summary(goalId));
    }
}
