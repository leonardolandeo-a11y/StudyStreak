package com.example.studystreak.dto.Validation;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ValidationRequestDTO {

    private Boolean approved;
    private String comment;

    public ValidationRequestDTO() {}
}