package com.example.studystreak.controller;

import com.example.studystreak.service.CurrentUserService;
import com.example.studystreak.service.ProfileImageStorage;
import com.example.studystreak.service.ProfileImageStorage.Slot;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.Locale;

@RestController
@RequestMapping("/api/profile")
public class ProfileImageController {
    private final CurrentUserService current;
    private final ProfileImageStorage images;
    public ProfileImageController(CurrentUserService current, ProfileImageStorage images) { this.current = current; this.images = images; }

    @GetMapping("/{slot:avatar|banner}")
    public ResponseEntity<byte[]> get(@PathVariable String slot) {
        var image = images.get(current.getCurrentUserId(), slot(slot));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.noStore()).header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", "default-src 'none'; sandbox").body(image.bytes());
    }
    /** Raw binary body avoids changing the existing evidence multipart limits. */
    @PutMapping("/{slot:avatar|banner}")
    public ResponseEntity<Void> put(@PathVariable String slot, HttpServletRequest request) throws IOException {
        images.put(current.getCurrentUserId(), slot(slot), request.getInputStream(), request.getContentType());
        return ResponseEntity.noContent().build();
    }
    @DeleteMapping("/{slot:avatar|banner}")
    public ResponseEntity<Void> delete(@PathVariable String slot) {
        images.delete(current.getCurrentUserId(), slot(slot));
        return ResponseEntity.noContent().build();
    }
    private Slot slot(String value) { return Slot.valueOf(value.toUpperCase(Locale.ROOT)); }
}
