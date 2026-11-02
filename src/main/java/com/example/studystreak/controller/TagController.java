package com.example.studystreak.controller;

import com.example.studystreak.dto.Tag.TagRequestDTO;
import com.example.studystreak.dto.Tag.TagResponseDTO;
import com.example.studystreak.service.TagService;
import com.example.studystreak.service.CurrentUserService;
import com.example.studystreak.exceptions.ForbiddenException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/{userId}/goals/{goalId}/tags")
public class TagController {

    private final TagService tagService;
    private final CurrentUserService currentUserService;

    public TagController(TagService tagService, CurrentUserService currentUserService) {
        this.tagService = tagService;
        this.currentUserService = currentUserService;
    }

    private void validateUserId(Long userId) {
        if (!currentUserService.getCurrentUserId().equals(userId)) {
            throw new ForbiddenException("You cannot access another user's goal tags");
        }
    }

    @GetMapping
    public ResponseEntity<Page<TagResponseDTO>> getGoalTags(
            @PathVariable Long userId,
            @PathVariable Long goalId,
            Pageable pageable
    ) {
        validateUserId(userId);
        return ResponseEntity.ok(
                tagService.getTagsByGoalId(goalId, pageable)
        );
    }

    @GetMapping("/{tagId}")
    public ResponseEntity<TagResponseDTO> getTag(
            @PathVariable Long userId,
            @PathVariable Long goalId,
            @PathVariable Long tagId
    ) {
        validateUserId(userId);
        return ResponseEntity.ok(
                tagService.getTagById(goalId, tagId)
        );
    }

    @PostMapping
    public ResponseEntity<TagResponseDTO> createTag(
            @Valid @RequestBody TagRequestDTO tagDTO,
            @PathVariable Long userId,
            @PathVariable Long goalId
    ) {
        validateUserId(userId);
        TagResponseDTO savedTag =
                tagService.createTag(tagDTO, goalId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedTag);
    }

    @PatchMapping("/{tagId}")
    public ResponseEntity<TagResponseDTO> updateTag(
            @Valid @RequestBody TagRequestDTO tagDTO,
            @PathVariable Long userId,
            @PathVariable Long tagId,
            @PathVariable Long goalId
    ) {
        validateUserId(userId);
        return ResponseEntity.ok(
                tagService.updateTag(goalId, tagId, tagDTO)
        );
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> removeTagFromGoal(
            @PathVariable Long userId,
            @PathVariable Long goalId,
            @PathVariable Long tagId
    ) {
        validateUserId(userId);
        tagService.removeTagFromGoal(goalId, tagId);

        return ResponseEntity.noContent().build();
    }
}
