package com.example.studystreak.dto.User;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

// Show its data
@Getter
@Setter
public class UserResponseDTO {
    private Long id;
    private String username;
    private String email;
    private Boolean active;
    private LocalDate registrationDate;
    private String timeZone;
    protected  UserResponseDTO(){}
}
