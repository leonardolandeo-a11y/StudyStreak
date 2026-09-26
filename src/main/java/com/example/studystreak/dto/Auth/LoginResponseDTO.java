package com.example.studystreak.dto.Auth;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponseDTO {
    private String token;
    private String refreshToken;

    protected LoginResponseDTO(){}

    public LoginResponseDTO(String token){
        this.token = token;
    }

    public LoginResponseDTO(String token, String refreshToken){
        this.token = token;
        this.refreshToken = refreshToken;
    }
}