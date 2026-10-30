package com.example.studystreak.service;

import com.example.studystreak.dto.Auth.LoginRequestDTO;
import com.example.studystreak.dto.Auth.LoginResponseDTO;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    private final UserRepository repository = mock(UserRepository.class);
    private final JwtService jwtService = mock(JwtService.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final AuthService service = new AuthService(repository, jwtService, encoder);
    private final User user = mock(User.class);

    @BeforeEach
    void setUp() {
        when(repository.findByUsername("learner")).thenReturn(Optional.of(user));
        when(user.getUsername()).thenReturn("learner");
        when(user.getPassword()).thenReturn("encoded");
    }

    @Test
    void loginRejectsDisabledUserEvenWithCorrectPassword() {
        LoginRequestDTO request = loginRequest();
        when(encoder.matches("password", "encoded")).thenReturn(true);
        when(user.getActive()).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> service.login(request));
        verifyNoInteractions(jwtService);
    }

    @Test
    void loginRejectsUserWithNullActiveFlag() {
        when(encoder.matches("password", "encoded")).thenReturn(true);

        assertThrows(BadCredentialsException.class, () -> service.login(loginRequest()));
        verifyNoInteractions(jwtService);
    }

    @Test
    void loginSucceedsForActiveUser() {
        when(user.getActive()).thenReturn(true);
        when(encoder.matches("password", "encoded")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("access-token");
        when(jwtService.generateRefreshToken(user)).thenReturn("refresh-token");

        LoginResponseDTO response = service.login(loginRequest());

        assertEquals("access-token", response.getToken());
        assertEquals("refresh-token", response.getRefreshToken());
    }

    @Test
    void refreshRejectsDisabledAccountBeforeIssuingTokens() {
        when(jwtService.extractUsername("old-refresh")).thenReturn("learner");
        when(user.getActive()).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> service.refresh("old-refresh"));
        verify(jwtService, never()).generateToken(any());
        verify(jwtService, never()).generateRefreshToken(any());
    }

    @Test
    void refreshRejectsInvalidTokenForActiveAccount() {
        when(jwtService.extractUsername("old-refresh")).thenReturn("learner");
        when(user.getActive()).thenReturn(true);
        when(jwtService.isRefreshTokenValid("old-refresh", user)).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> service.refresh("old-refresh"));
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void refreshSucceedsWithValidTokenForActiveAccount() {
        when(jwtService.extractUsername("old-refresh")).thenReturn("learner");
        when(user.getActive()).thenReturn(true);
        when(jwtService.isRefreshTokenValid("old-refresh", user)).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("next-access");
        when(jwtService.generateRefreshToken(user)).thenReturn("next-refresh");

        LoginResponseDTO response = service.refresh("old-refresh");

        assertEquals("next-access", response.getToken());
        assertEquals("next-refresh", response.getRefreshToken());
    }

    private LoginRequestDTO loginRequest() {
        LoginRequestDTO request = mock(LoginRequestDTO.class);
        when(request.getUsername()).thenReturn("learner");
        when(request.getPassword()).thenReturn("password");
        return request;
    }
}
