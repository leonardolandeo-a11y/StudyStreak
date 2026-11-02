package com.example.studystreak.service;

import com.example.studystreak.dto.Auth.LoginRequestDTO;
import com.example.studystreak.dto.Auth.LoginResponseDTO;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.RefreshSessionStore;
import com.example.studystreak.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final JwtService jwt = mock(JwtService.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final RefreshSessionStore sessions = mock(RefreshSessionStore.class);
    private final RefreshTokenHasher hasher = mock(RefreshTokenHasher.class);
    private final AuthService service = new AuthService(users, jwt, encoder, sessions, hasher);
    private final User user = mock(User.class);

    @BeforeEach
    void setUp() {
        when(users.findByUsername("learner")).thenReturn(Optional.of(user));
        when(user.getId()).thenReturn(11L);
        when(user.getUsername()).thenReturn("learner");
        when(user.getPassword()).thenReturn("encoded");
    }

    private LoginRequestDTO request() {
        LoginRequestDTO request = mock(LoginRequestDTO.class);
        when(request.getUsername()).thenReturn("learner");
        when(request.getPassword()).thenReturn("password");
        return request;
    }

    @Test
    void disabledAccountCannotLogin() {
        when(user.getActive()).thenReturn(false);
        when(encoder.matches("password", "encoded")).thenReturn(true);
        assertThrows(BadCredentialsException.class, () -> service.login(request()));
        verifyNoInteractions(sessions);
    }

    @Test
    void loginPersistsOnlyHashedRefreshTokenIdentifier() {
        when(user.getActive()).thenReturn(true);
        when(encoder.matches("password", "encoded")).thenReturn(true);
        when(jwt.generateRefreshToken(eq(user), any(UUID.class))).thenReturn("new-refresh");
        when(jwt.extractRefreshTokenId("new-refresh")).thenReturn("random-jti");
        when(jwt.extractExpiration("new-refresh")).thenReturn(Date.from(Instant.now().plusSeconds(600)));
        when(hasher.hash("random-jti")).thenReturn("hashed-jti");
        when(jwt.generateToken(user)).thenReturn("access");

        LoginResponseDTO result = service.login(request());
        assertEquals("access", result.getToken());
        assertEquals("new-refresh", result.getRefreshToken());
        verify(sessions).create(any(UUID.class), eq(11L), eq("hashed-jti"), any(Instant.class));
    }

    private void prepareValidOldToken() {
        when(jwt.extractUsername("old-refresh")).thenReturn("learner");
        when(user.getActive()).thenReturn(true);
        when(jwt.isRefreshTokenValid("old-refresh", user)).thenReturn(true);
        when(jwt.extractRefreshSessionId("old-refresh"))
                .thenReturn("4493749b-d38f-4ea7-9f4e-110fac109e64");
        when(jwt.extractRefreshTokenId("old-refresh")).thenReturn("old-jti");
        when(hasher.hash("old-jti")).thenReturn("hashed-old");
        when(jwt.generateRefreshToken(eq(user), any(UUID.class))).thenReturn("next-refresh");
        when(jwt.extractRefreshTokenId("next-refresh")).thenReturn("next-jti");
        when(jwt.extractExpiration("next-refresh")).thenReturn(Date.from(Instant.now().plusSeconds(600)));
        when(hasher.hash("next-jti")).thenReturn("hashed-next");
    }

    @Test
    void refreshRotatesExactlyOnceAndReturnsNewTokens() {
        prepareValidOldToken();
        when(sessions.rotate(any(UUID.class), eq(11L), eq("hashed-old"), eq("hashed-next"), any(Instant.class)))
                .thenReturn(true);
        when(jwt.generateToken(user)).thenReturn("next-access");
        LoginResponseDTO result = service.refresh("old-refresh");
        assertEquals("next-access", result.getToken());
        assertEquals("next-refresh", result.getRefreshToken());
        verify(sessions, times(1)).rotate(any(UUID.class), eq(11L), eq("hashed-old"), eq("hashed-next"), any(Instant.class));
    }

    @Test
    void alreadyConsumedTokenIsRejected() {
        prepareValidOldToken();
        when(sessions.rotate(any(UUID.class), anyLong(), anyString(), anyString(), any(Instant.class)))
                .thenReturn(false);
        assertThrows(BadCredentialsException.class, () -> service.refresh("old-refresh"));
        verify(jwt, never()).generateToken(any(User.class));
    }

    @Test
    void disabledAccountCannotRefresh() {
        when(jwt.extractUsername("old-refresh")).thenReturn("learner");
        when(jwt.isRefreshTokenValid("old-refresh", user)).thenReturn(false);
        assertThrows(BadCredentialsException.class, () -> service.refresh("old-refresh"));
        verifyNoInteractions(sessions);
    }

    @Test
    void logoutRevokesOnlyMatchingSessionToken() {
        prepareValidOldToken();
        service.logout("old-refresh");
        verify(sessions).revoke(any(UUID.class), eq(11L), eq("hashed-old"));
    }

    @Test
    void logoutOfInvalidTokenDoesNotRevoke() {
        when(jwt.extractUsername("invalid")).thenThrow(new IllegalArgumentException("malformed"));
        service.logout("invalid");
        verifyNoInteractions(sessions);
    }
}
