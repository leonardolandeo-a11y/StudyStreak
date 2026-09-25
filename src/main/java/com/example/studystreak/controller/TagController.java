package com.example.studystreak.controller;

import com.example.studystreak.dto.Tag.TagRequestDTO;
import com.example.studystreak.dto.Tag.TagResponseDTO;
import com.example.studystreak.service.GoalService;
import com.example.studystreak.service.TagService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/{userId}/goals/{goalId}/tags")
public class TagController {
    private final TagService tagService;

    public TagController(TagService tagService, GoalService goalService) {

        this.tagService = tagService;
    }
    //get
    @GetMapping
    public ResponseEntity<Page<TagResponseDTO>> getGoalTags(@PathVariable Long goalId, Pageable pageable) {
        return ResponseEntity.ok(tagService.getTagsByGoalId(goalId, pageable));
    }
    @GetMapping("/{tagId}")
    public ResponseEntity<TagResponseDTO> getTag(@PathVariable Long goalId, @PathVariable Long tagId) {
        TagResponseDTO tagDTO = tagService.getTagById(goalId, tagId);
        return ResponseEntity.ok(tagDTO);
    }
    //post
    @PostMapping
    public ResponseEntity<TagResponseDTO> createTag(@RequestBody TagRequestDTO tagDTO, @PathVariable Long userId,
                                                    @PathVariable Long goalId) {

        TagResponseDTO savedTag = tagService.createTag(tagDTO,userId,goalId);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedTag);
    }

    //put/patch
    @PatchMapping("/{tagId}")
    public ResponseEntity<TagResponseDTO> updateTag(@RequestBody TagRequestDTO tagDTO, @PathVariable Long tagId,
                                            @PathVariable Long goalId) {

    TagResponseDTO updateTag = tagService.updateTag(goalId,tagId,tagDTO);
    return ResponseEntity.ok(updateTag);
    }
    //delete
    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> removeTagFromGoal(@PathVariable Long goalId, @PathVariable Long tagId) {

        tagService.removeTagFromGoal(goalId, tagId);
        return ResponseEntity.noContent().build();
    }
}

