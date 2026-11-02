package com.example.studystreak.controller;

import com.example.studystreak.service.DailyRecordVoiceService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/goals/{goalId}/daily-records/{recordId}/voice")
public class DailyRecordVoiceController {
    private final DailyRecordVoiceService voiceService;

    public DailyRecordVoiceController(DailyRecordVoiceService voiceService) {
        this.voiceService = voiceService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> upload(@PathVariable Long goalId,
                                       @PathVariable Long recordId,
                                       @RequestParam("audio") MultipartFile audio) {
        voiceService.save(goalId, recordId, audio);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(produces = "audio/mp4")
    public ResponseEntity<byte[]> download(@PathVariable Long goalId,
                                           @PathVariable Long recordId) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mp4"))
                .cacheControl(CacheControl.noStore())
                .body(voiceService.read(goalId, recordId));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@PathVariable Long goalId,
                                       @PathVariable Long recordId) {
        voiceService.remove(goalId, recordId);
        return ResponseEntity.noContent().build();
    }
}
