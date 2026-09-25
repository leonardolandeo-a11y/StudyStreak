package com.example.studystreak.service;

import com.example.studystreak.dto.Tag.TagRequestDTO;
import com.example.studystreak.dto.Tag.TagResponseDTO;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.Tag;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.TagRepository;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.studystreak.exceptions.ForbiddenException;

@Service
public class TagService {
    //private final: variable privada e inmutable
        private final TagRepository tagRepository;
        private final GoalRepository goalRepository;
        private final ModelMapper modelMapper;
        private final CurrentUserService currentUserService;


        public TagService(TagRepository tagRepository, ModelMapper modelMapper, GoalRepository goalRepository,
                          CurrentUserService currentUserService) {
            this.tagRepository = tagRepository;
            this.goalRepository = goalRepository;
            this.modelMapper = modelMapper;
            this.currentUserService = currentUserService;
        }

    private Goal getOwnedGoal(Long goalId) {

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));

        Long currentUserId = currentUserService.getCurrentUserId();

        if (!goal.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You cannot access goal with id: " + goalId);
        }
        return goal;
    }

    @Transactional
    public TagResponseDTO createTag(TagRequestDTO tagDTO, Long goalId) {

        Goal goal = getOwnedGoal(goalId);
        Long currentUserId = currentUserService.getCurrentUserId();

        String tagName = tagDTO.getName().trim();

        Tag tag = tagRepository.findByNameAndUserId(tagName, currentUserId)
                .orElseGet(() -> new Tag(tagName));

        boolean alreadyAssigned =
                tag.getGoals()
                        .stream()
                        .anyMatch(existingGoal ->
                                existingGoal
                                        .getId()
                                        .equals(goalId)
                        );
        if (!alreadyAssigned) {
            tag.addGoal(goal);
            goal.addTag(tag);
        }
        Tag savedTag = tagRepository.save(tag);
        return modelMapper.map(savedTag, TagResponseDTO.class);
    }

    public Page<TagResponseDTO> getTagsByGoalId(Long goalId, Pageable pageable) {

        getOwnedGoal(goalId);
        return tagRepository
                .findAllByGoalId(goalId, pageable)
                .map(tag -> modelMapper.map(tag, TagResponseDTO.class));
    }

    public TagResponseDTO getTagById(Long goalId, Long tagId) {

        getOwnedGoal(goalId);
        Tag tag = tagRepository
                .findByIdAndGoalId(tagId, goalId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Tag not found with id: " + tagId + " for goal: " + goalId)
                );

        return modelMapper.map(tag, TagResponseDTO.class);
    }
    @Transactional
    public TagResponseDTO updateTag(Long goalId, Long tagId, TagRequestDTO tagDTO) {

        getOwnedGoal(goalId);
        Tag tag = tagRepository
                .findByIdAndGoalId(tagId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id: " + tagId +
                        " for goal: " + goalId));

        tag.setName(tagDTO.getName().trim());

        Tag updatedTag = tagRepository.save(tag);

        return modelMapper.map(updatedTag, TagResponseDTO.class);
    }

    @Transactional
    public void removeTagFromGoal(Long goalId, Long tagId) {

        Goal goal = getOwnedGoal(goalId);

        Tag tag = tagRepository.findByIdAndGoalId(tagId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id: " + tagId
                                        + " for goal: " + goalId));

        tag.removeGoal(goal);
        goal.removeTag(tag);

        tagRepository.save(tag);
    }
}
