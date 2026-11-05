package com.example.studystreak.controller;

import com.example.studystreak.dto.Focus.FocusSessionRequestDTO;
import com.example.studystreak.service.StudyLedgerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/goals/{goalId}/focus-sessions")
public class FocusSessionController {
    private final StudyLedgerService ledger;
    public FocusSessionController(StudyLedgerService ledger) { this.ledger = ledger; }

    @PostMapping
    public ResponseEntity<Map<String,Object>> complete(@PathVariable Long goalId,
            @Valid @RequestBody FocusSessionRequestDTO request) {
        return ResponseEntity.ok(ledger.complete(goalId, request.sessionId(), request.durationMinutes()));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String,Object>> summary(@PathVariable Long goalId) {
        return ResponseEntity.ok(ledger.summary(goalId));
    }
}
