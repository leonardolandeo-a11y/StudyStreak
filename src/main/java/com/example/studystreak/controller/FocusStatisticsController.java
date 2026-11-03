package com.example.studystreak.controller;

import com.example.studystreak.dto.Focus.FocusStatisticsDTO;
import com.example.studystreak.service.FocusStatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/focus-sessions")
public class FocusStatisticsController {
    private final FocusStatisticsService service;

    public FocusStatisticsController(FocusStatisticsService service) {
        this.service = service;
    }

    @GetMapping("/stats")
    public ResponseEntity<FocusStatisticsDTO> stats(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(service.getStatistics(days));
    }
}
