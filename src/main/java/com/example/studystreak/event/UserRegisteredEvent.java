package com.example.studystreak.event;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRegisteredEvent {
    private final String email;
    private final String username;

    public UserRegisteredEvent(String email, String username) {
        this.email = email;
        this.username = username;
    }
}
