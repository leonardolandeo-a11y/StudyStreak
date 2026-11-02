package com.example.studystreak.service;

import com.example.studystreak.model.Role;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomUserDetailsServiceTest {
    @Test
    void disabledDatabaseAccountProducesDisabledUserDetails() {
        UserRepository repository = mock(UserRepository.class);
        User user = mock(User.class);
        when(user.getUsername()).thenReturn("learner");
        when(user.getPassword()).thenReturn("encoded");
        when(user.getRole()).thenReturn(Role.USER);
        when(user.getActive()).thenReturn(false);
        when(repository.findByUsername("learner")).thenReturn(Optional.of(user));

        UserDetails details = new CustomUserDetailsService(repository).loadUserByUsername("learner");

        assertFalse(details.isEnabled());
    }

    @Test
    void activeDatabaseAccountProducesEnabledUserDetails() {
        UserRepository repository = mock(UserRepository.class);
        User user = mock(User.class);
        when(user.getUsername()).thenReturn("learner");
        when(user.getPassword()).thenReturn("encoded");
        when(user.getRole()).thenReturn(Role.USER);
        when(user.getActive()).thenReturn(true);
        when(repository.findByUsername("learner")).thenReturn(Optional.of(user));

        UserDetails details = new CustomUserDetailsService(repository).loadUserByUsername("learner");

        assertTrue(details.isEnabled());
    }
}
