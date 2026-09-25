package com.example.studystreak.dto.Goal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GoalResponseDTO {

    private Long id;
    private String topic;
    private Integer frequency;
    private Integer duration;

    public GoalResponseDTO() {
    }
}