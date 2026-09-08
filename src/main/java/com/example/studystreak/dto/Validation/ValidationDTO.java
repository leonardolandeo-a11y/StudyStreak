package com.example.studystreak.dto.Validation;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ValidationDTO {
    private Boolean approved;
    private String comment;

    protected ValidationDTO(){}
}
