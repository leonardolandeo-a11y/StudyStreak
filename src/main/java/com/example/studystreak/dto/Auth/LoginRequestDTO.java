package com.example.studystreak.dto.Auth;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequestDTO {
    private String username;
    private String password;

    protected LoginRequestDTO(){}

}
