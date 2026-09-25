package com.example.studystreak.dto.Goal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GoalRequestDTO {

    @NotBlank(message = "El tema es obligatorio")
    private String topic;

    @NotNull(message = "La frecuencia es obligatoria")
    @Positive(message = "La frecuencia debe ser mayor que cero")
    private Integer frequency;

    @NotNull(message = "La duración es obligatoria")
    @Positive(message = "La duración debe ser mayor que cero")
    private Integer duration;

    private Boolean completed;

    public GoalRequestDTO() {}
}