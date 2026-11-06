package com.example.studystreak.collaboration;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/api/study-rooms/{id}/collaboration")
public class RoomCollaborationController {
    private final RoomCollaborationService service;
    public RoomCollaborationController(RoomCollaborationService service) {this.service=service;}
    public record Message(@NotNull UUID id,@NotBlank @Size(max=1000) String text) {}
    public record Hand(@NotNull Boolean raised) {}
    public record Reaction(@NotBlank @Size(max=8) String reaction) {}
    @GetMapping public RoomCollaborationService.Feed feed(@PathVariable UUID id,@RequestParam(defaultValue="0") int page) {return service.feed(id,page);}
    @PostMapping("/messages") public RoomMessage send(@PathVariable UUID id,@Valid @RequestBody Message message) {return service.send(id,message.id(),message.text());}
    @DeleteMapping("/messages/{messageId}") public void remove(@PathVariable UUID id,@PathVariable UUID messageId) {service.remove(id,messageId);}
    @PutMapping("/hand") public void hand(@PathVariable UUID id,@Valid @RequestBody Hand hand) {service.hand(id,hand.raised());}
    @PostMapping("/reaction") public void reaction(@PathVariable UUID id,@Valid @RequestBody Reaction reaction) {service.react(id,reaction.reaction());}
}
