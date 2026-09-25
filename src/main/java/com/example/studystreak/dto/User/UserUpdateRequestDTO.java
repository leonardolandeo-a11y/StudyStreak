package com.example.studystreak.dto.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserUpdateRequestDTO {

    @Size(min = 3, max = 30, message = "Username must contain between 3 and 30 characters")
    private String username;

    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    private String email;

    @Size(max = 50, message = "Time zone cannot exceed 50 characters")
    private String timeZone;

    protected UserUpdateRequestDTO(){}
}