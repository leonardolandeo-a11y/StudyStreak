package com.example.studystreak.controller;

import com.example.studystreak.dto.Tag.TagRequestDTO;
import com.example.studystreak.dto.Tag.TagResponseDTO;
import com.example.studystreak.service.TagService;
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

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public ResponseEntity<Page<TagResponseDTO>> getGoalTags(
            @PathVariable Long goalId,
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                tagService.getTagsByGoalId(goalId, pageable)
        );
    }

    @GetMapping("/{tagId}")
    public ResponseEntity<TagResponseDTO> getTag(
            @PathVariable Long goalId,
            @PathVariable Long tagId
    ) {
        return ResponseEntity.ok(
                tagService.getTagById(goalId, tagId)
        );
    }

    @PostMapping
    public ResponseEntity<TagResponseDTO> createTag(
            @Valid @RequestBody TagRequestDTO tagDTO,
            @PathVariable Long goalId
    ) {
        TagResponseDTO savedTag =
                tagService.createTag(tagDTO, goalId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedTag);
    }

    @PatchMapping("/{tagId}")
    public ResponseEntity<TagResponseDTO> updateTag(
            @Valid @RequestBody TagRequestDTO tagDTO,
            @PathVariable Long tagId,
            @PathVariable Long goalId
    ) {
        return ResponseEntity.ok(
                tagService.updateTag(goalId, tagId, tagDTO)
        );
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> removeTagFromGoal(
            @PathVariable Long goalId,
            @PathVariable Long tagId
    ) {
        tagService.removeTagFromGoal(goalId, tagId);

        return ResponseEntity.noContent().build();
    }
}
