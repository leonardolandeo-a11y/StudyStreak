package com.example.studystreak.dto.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

// Register
@Getter
@Setter
public class UserRequestDTO {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must contain between 3 and 30 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must contain between 8 and 72 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$", message = "Password must contain uppercase, lowercase and number")
    private String password;

    @NotBlank(message = "Time zone is required")
    @Size(max = 50, message = "Time zone cannot exceed 50 characters")
    private String timeZone;

    protected UserRequestDTO(){}
}