package com.example.studystreak.dto;

import lombok.Getter;

import java.time.Instant;

@Getter
public class ErrorResponseDTO {

    private final Instant timestamp;
    private final int status;
    private final String error;
    private final String message;
    private final String path;

    public ErrorResponseDTO(int status, String error, String message, String path) {
        this.timestamp = Instant.now();
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }
}