package com.example.studystreak.controller;
import com.example.studystreak.service.StudyLedgerService;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
@RestController
@RequestMapping("/api/study")
public class StudyLedgerController {
    private final StudyLedgerService service;
    private final com.example.studystreak.service.StudyAnalyticsService analytics;
    public StudyLedgerController(StudyLedgerService service,com.example.studystreak.service.StudyAnalyticsService analytics) { this.service=service;this.analytics=analytics; }
    public record Start(@NotNull UUID sessionId,@NotNull @Positive Long goalId,@Min(5) @Max(120) int minutes) {}
    public record Pulse(@NotNull String action) {}
    public record Selection(Long goalId) {}
    @GetMapping("/active") public Map<String,Object> active() { return service.active(); }
    @GetMapping("/history") public Map<String,Object> history(@RequestParam java.time.LocalDate from,@RequestParam java.time.LocalDate to,@RequestParam(defaultValue="0") int page) { return analytics.history(from,to,page); }
    @PostMapping("/sessions") public Map<String,Object> start(@Valid @RequestBody Start request) {
        return service.start(request.sessionId(),request.goalId(),request.minutes());
    }
    @PostMapping("/sessions/{id}") public Map<String,Object> pulse(@PathVariable UUID id,@Valid @RequestBody Pulse request) { return service.pulse(id,request.action()); }
    @GetMapping("/rooms/{id}/selection") public Map<String,Object> selection(@PathVariable UUID id) { return service.selection(id); }
    @PutMapping("/rooms/{id}/selection") public Map<String,Object> select(@PathVariable UUID id,@RequestBody Selection request) { return service.select(id,request.goalId()); }
}
