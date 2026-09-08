package com.example.studystreak.dto.Goal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GoalDTO {
    private String topic;
    private Integer frequency;
    private Integer duration;
    protected GoalDTO(){}
}
