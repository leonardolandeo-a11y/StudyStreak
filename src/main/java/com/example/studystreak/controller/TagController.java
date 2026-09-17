package com.example.studystreak.controller;

import com.example.studystreak.dto.Goal.GoalDTO;
import com.example.studystreak.dto.Tag.TagDTO;
import com.example.studystreak.service.GoalService;
import com.example.studystreak.service.TagService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/users/{user}/goals/{goal}/tags")
public class TagController {
    private final TagService tagService;
    private final GoalService goalService;

    public TagController(TagService tagService, GoalService goalService) {
        this.tagService = tagService;
        this.goalService = goalService;
    }
    //get
    @GetMapping
    public ResponseEntity<List<TagDTO>> getGoalTags() {

        List<TagDTO> allTags = tagService.getAllTags();
        return ResponseEntity.ok(allTags);
    }
    @GetMapping()
    public ResponseEntity<TagDTO> getTag(Long TagId) {
        TagDTO tagDTO = tagService.getTagById(TagId);
        return ResponseEntity.ok(tagDTO);
    }
    //post
    @PostMapping
    public ResponseEntity<TagDTO> createTag(TagDTO tagDTO, Long userId, Long goalId) {
        TagDTO savedTag = tagService.createTag(tagDTO,userId,goalId);
        return ResponseEntity.ok(savedTag);
    }
    //put/patch
    @PatchMapping("/{tagId}")
    public ResponseEntity<TagDTO> updateTag(@PathVariable Long tagId, @RequestBody TagDTO tagDTO) {
    TagDTO UpdatedGoal = tagService.updateTag(tagId,tagDTO);
    return ResponseEntity.ok(UpdatedGoal);
    }
    //delete
    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long tagId) {
        tagService.deleteTag(tagId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
