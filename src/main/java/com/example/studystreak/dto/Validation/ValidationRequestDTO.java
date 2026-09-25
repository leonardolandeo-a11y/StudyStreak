package com.example.studystreak.dto.Validation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ValidationRequestDTO {

    @NotNull(message = "Approved status is required")
    private Boolean approved;

    @Size(max = 500, message = "Comment cannot exceed 500 characters")
    private String comment;

    public ValidationRequestDTO() {}
}