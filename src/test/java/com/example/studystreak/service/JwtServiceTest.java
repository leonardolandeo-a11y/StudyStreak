package com.example.studystreak.service;

import com.example.studystreak.model.Role;
import com.example.studystreak.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class JwtServiceTest {

    private JwtService jwtService;
    private User user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();

        ReflectionTestUtils.setField(
                jwtService,
                "secretKey",
                "c3R1ZHlzdHJlYWstdGVzdC1zZWNyZXQta2V5LTEyMzQ1Njc4OTA="
        );

        ReflectionTestUtils.setField(
                jwtService,
                "jwtExpiration",
                86400000L
        );

        ReflectionTestUtils.setField(
                jwtService,
                "refreshExpiration",
                604800000L
        );

        user = Mockito.mock(User.class);

        when(user.getId()).thenReturn(1L);
        when(user.getUsername()).thenReturn("test_user");
        when(user.getEmail()).thenReturn("test@example.com");
        when(user.getRole()).thenReturn(Role.USER);
    }

    @Test
    void accessTokenShouldBeValid() {
        String token = jwtService.generateToken(user);

        assertTrue(
                jwtService.isTokenValid(
                        token,
                        "test_user"
                )
        );

        assertEquals(
                "access",
                jwtService.extractTokenType(token)
        );
    }

    @Test
    void refreshTokenShouldBeValid() {
        String token =
                jwtService.generateRefreshToken(user);

        assertTrue(
                jwtService.isRefreshTokenValid(
                        token,
                        "test_user"
                )
        );

        assertEquals(
                "refresh",
                jwtService.extractTokenType(token)
        );
    }

    @Test
    void refreshTokenCannotBeUsedAsAccessToken() {
        String refreshToken =
                jwtService.generateRefreshToken(user);

        assertFalse(
                jwtService.isTokenValid(
                        refreshToken,
                        "test_user"
                )
        );
    }
}