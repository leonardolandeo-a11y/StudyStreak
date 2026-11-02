package com.example.studystreak.controller;

import com.example.studystreak.dto.Dashboard.GoalSummaryDTO;
import com.example.studystreak.dto.Dashboard.RecordSummaryDTO;
import com.example.studystreak.dto.Dashboard.StreakSummaryDTO;
import com.example.studystreak.dto.Dashboard.ValidationSummaryDTO;
import com.example.studystreak.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/goals")
    public GoalSummaryDTO getGoals() {
        return dashboardService.getGoalSummary();
    }

    @GetMapping("/streaks")
    public StreakSummaryDTO getStreaks() {
        return dashboardService.getStreakSummary();
    }

    @GetMapping("/records")
    public RecordSummaryDTO getRecords() {
        return dashboardService.getRecordSummary();
    }

    @GetMapping("/validations")
    public ValidationSummaryDTO getValidations() {
        return dashboardService.getValidationSummary();
    }
}
