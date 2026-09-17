package com.example.studystreak.dto.Auth;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponseDTO {
    private String token;

    protected LoginResponseDTO(){}
    public LoginResponseDTO(String token){
        this.token = token;
    }
}
