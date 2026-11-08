package com.example.studystreak.controller;

import com.example.studystreak.dto.Social.SocialPrivacy;
import com.example.studystreak.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
public class SocialProfileController {
    private final SocialProfileService social;
    private final ProfileImageStorage images;
    public SocialProfileController(SocialProfileService social,ProfileImageStorage images) { this.social=social;this.images=images; }
    public record Heartbeat(@NotNull UUID sessionId) {}
    private <T> ResponseEntity<T> privateResponse(T value) { return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(value); }
    @GetMapping("/api/users/{id}/profile") public ResponseEntity<SocialProfileService.Profile> profile(@PathVariable long id) { return privateResponse(social.profile(id)); }
    @GetMapping("/api/users/{id}/presence") public ResponseEntity<SocialProfileService.Presence> presence(@PathVariable long id) { return privateResponse(social.presence(id)); }
    @GetMapping("/api/profile/privacy") public ResponseEntity<SocialPrivacy> privacy() { return privateResponse(social.ownPrivacy()); }
    @PutMapping("/api/profile/privacy") public ResponseEntity<SocialPrivacy> privacy(@Valid @RequestBody SocialPrivacy value) { return privateResponse(social.updatePrivacy(value)); }
    @PostMapping("/api/presence/heartbeat") public ResponseEntity<SocialProfileService.Presence> heartbeat(@Valid @RequestBody Heartbeat body) { return privateResponse(social.heartbeat(body.sessionId())); }
    @GetMapping("/api/users/{id}/profile/{slot:avatar|banner}") public ResponseEntity<byte[]> image(@PathVariable long id,@PathVariable String slot) {
        social.authorized(id);
        var image=images.get(id,ProfileImageStorage.Slot.valueOf(slot.toUpperCase(Locale.ROOT)));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.parseMediaType(image.contentType()))
                .header("X-Content-Type-Options","nosniff").header("Content-Security-Policy","default-src 'none'; sandbox").body(image.bytes());
    }
}
