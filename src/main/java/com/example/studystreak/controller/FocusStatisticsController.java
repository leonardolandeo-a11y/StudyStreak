package com.example.studystreak.controller;

import com.example.studystreak.service.StudyAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/focus-sessions")
public class FocusStatisticsController {
    private final StudyAnalyticsService service;

    public FocusStatisticsController(StudyAnalyticsService service) {
        this.service = service;
    }

    @GetMapping("/stats")
    public ResponseEntity<java.util.Map<String,Object>> stats(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(service.stats(days));
    }
}
