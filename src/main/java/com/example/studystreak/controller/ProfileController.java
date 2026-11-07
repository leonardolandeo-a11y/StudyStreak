package com.example.studystreak.controller;

import com.example.studystreak.dto.Profile.ProfileResponse;
import com.example.studystreak.dto.Profile.ProfileUpdateRequest;
import com.example.studystreak.service.ProfileService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService profiles;
    public ProfileController(ProfileService profiles) { this.profiles = profiles; }
    @GetMapping public ProfileResponse get() { return profiles.get(); }
    @PatchMapping public ProfileResponse update(@RequestBody ProfileUpdateRequest request) { return profiles.update(request); }
}
