package com.example.studystreak.media;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController
@RequestMapping("/api/study-rooms/{id}/media")
public class StudyMediaController {
    private final StudyMediaService service;
    public StudyMediaController(StudyMediaService service) { this.service=service; }
    @GetMapping public StudyMediaService.State state(@PathVariable UUID id) { return service.state(id); }
    @PostMapping("/token") public ResponseEntity<StudyMediaService.Credentials> token(@PathVariable UUID id, @RequestParam(defaultValue="true") boolean publish) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.token(id,publish));
    }
    public record Permission(@NotNull Boolean allowed) {}
    @PutMapping("/permissions/{user}") public void permission(@PathVariable UUID id,@PathVariable long user,@Valid @RequestBody Permission request) {
        service.permission(id,user,request.allowed());
    }
    @DeleteMapping("/members/{user}") public void kick(@PathVariable UUID id,@PathVariable long user) { service.kick(id,user); }
}
