package com.example.studystreak.dto.User;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserUpdateRequestDTO {
    private String username;
    private String email;
    private String timeZone;

    protected UserUpdateRequestDTO(){};
}
