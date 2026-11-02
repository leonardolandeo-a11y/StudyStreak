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
        when(user.getActive()).thenReturn(true);
    }

    @Test
    void accessTokenShouldBeValid() {
        String token = jwtService.generateToken(user);

        assertTrue(
                jwtService.isTokenValid(token, user)
        );

        assertEquals(
                "access",
                jwtService.extractTokenType(token)
        );
    }

    @Test
    void twoRefreshTokensIssuedImmediatelyAreUnique() {
        String first = jwtService.generateRefreshToken(user);
        String second = jwtService.generateRefreshToken(user);
        assertNotEquals(first, second);
        assertNotEquals(jwtService.extractRefreshTokenId(first), jwtService.extractRefreshTokenId(second));
        assertNotNull(jwtService.extractRefreshSessionId(first));
    }

    @Test
    void refreshTokenShouldBeValid() {
        String token =
                jwtService.generateRefreshToken(user);

        assertTrue(
                jwtService.isRefreshTokenValid(token, user)
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
                jwtService.isTokenValid(refreshToken, user)
        );
    }

    @Test
    void accessTokenCannotAuthenticateDifferentAccountWithSameUsername() {
        String token = jwtService.generateToken(user);
        when(user.getId()).thenReturn(2L);

        assertFalse(jwtService.isTokenValid(token, user));
    }

    @Test
    void refreshTokenCannotAuthenticateDifferentAccountWithSameUsername() {
        String token = jwtService.generateRefreshToken(user);
        when(user.getId()).thenReturn(2L);

        assertFalse(jwtService.isRefreshTokenValid(token, user));
    }

    @Test
    void disabledAccountCannotUseAccessOrRefreshTokens() {
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        when(user.getActive()).thenReturn(false);

        assertFalse(jwtService.isTokenValid(accessToken, user));
        assertFalse(jwtService.isRefreshTokenValid(refreshToken, user));
    }

    @Test
    void missingActiveFlagIsTreatedAsDisabled() {
        String token = jwtService.generateToken(user);
        when(user.getActive()).thenReturn(null);

        assertFalse(jwtService.isTokenValid(token, user));
    }

    @Test
    void oldRoleCannotBeReusedAfterRoleChange() {
        String token = jwtService.generateToken(user);
        when(user.getRole()).thenReturn(Role.ADMIN);

        assertFalse(jwtService.isTokenValid(token, user));
    }

    @Test
    void accessTokenCannotBeUsedToRefreshSession() {
        String token = jwtService.generateToken(user);

        assertFalse(jwtService.isRefreshTokenValid(token, user));
    }

}