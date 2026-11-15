package com.example.studystreak.dto.Goal;

import com.example.studystreak.model.GoalDifficulty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GoalResponseDTO {

    private Long id;
    private String topic;
    private Integer frequency;
    private Integer duration;
    private Boolean completed;

    // Optional for historical goals and older clients.
    private GoalDifficulty difficulty;

    public GoalResponseDTO() {}
}