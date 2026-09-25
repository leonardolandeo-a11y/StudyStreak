package com.example.studystreak.dto.Validation;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ValidationResponseDTO {

    private Long id;
    private Boolean approved;
    private String comment;

    public ValidationResponseDTO() {}
}