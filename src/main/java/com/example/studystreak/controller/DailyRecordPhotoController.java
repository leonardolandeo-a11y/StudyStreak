package com.example.studystreak.controller;

import com.example.studystreak.service.DailyRecordPhotoService;
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
@RequestMapping("/api/goals/{goalId}/daily-records/{recordId}/photo")
public class DailyRecordPhotoController {
    private final DailyRecordPhotoService photoService;

    public DailyRecordPhotoController(DailyRecordPhotoService photoService) {
        this.photoService = photoService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> upload(@PathVariable Long goalId,
                                       @PathVariable Long recordId,
                                       @RequestParam("photo") MultipartFile photo) {
        photoService.save(goalId, recordId, photo);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> download(@PathVariable Long goalId,
                                           @PathVariable Long recordId) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.noStore())
                .body(photoService.read(goalId, recordId));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@PathVariable Long goalId,
                                       @PathVariable Long recordId) {
        photoService.remove(goalId, recordId);
        return ResponseEntity.noContent().build();
    }
}
