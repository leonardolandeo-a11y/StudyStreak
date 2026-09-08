package com.example.studystreak.dto.User;

import lombok.Getter;
import lombok.Setter;

// Register
@Getter
@Setter
public class UserRequestDTO {
    private String username;
    private String email;
    private String password;
    private String timeZone;

    protected UserRequestDTO(){}
}
