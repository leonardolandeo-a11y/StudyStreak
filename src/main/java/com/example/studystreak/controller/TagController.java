package com.example.studystreak.controller;

import com.example.studystreak.dto.Tag.TagDTO;
import com.example.studystreak.service.TagService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/{userId}/goals/{goalId}/tags")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    //get
    @GetMapping
    public ResponseEntity<List<TagDTO>> getGoalTags(
            @PathVariable Long userId,
            @PathVariable Long goalId) {

        List<TagDTO> allTags = tagService.getAllTags();

        return ResponseEntity.ok(allTags);
    }

    @GetMapping("/{tagId}")
    public ResponseEntity<TagDTO> getTag(@PathVariable Long tagId) {

        TagDTO tagDTO = tagService.getTagById(tagId);

        return ResponseEntity.ok(tagDTO);
    }

    //post
    @PostMapping
    public ResponseEntity<TagDTO> createTag(
            @PathVariable Long userId,
            @PathVariable Long goalId,
            @RequestBody TagDTO tagDTO) {

        TagDTO savedTag = tagService.createTag(tagDTO, userId, goalId);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedTag);
    }

    //put/patch
    @PatchMapping("/{tagId}")
    public ResponseEntity<TagDTO> updateTag(
            @PathVariable Long tagId,
            @RequestBody TagDTO tagDTO) {

        TagDTO updatedTag = tagService.updateTag(tagId, tagDTO);

        return ResponseEntity.ok(updatedTag);
    }

    //delete
    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long tagId) {

        tagService.deleteTag(tagId);

        return ResponseEntity.noContent().build();
    }
}