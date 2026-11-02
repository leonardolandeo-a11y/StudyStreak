package com.example.studystreak.service;

import com.example.studystreak.dto.Auth.LoginRequestDTO;
import com.example.studystreak.dto.Auth.LoginResponseDTO;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.RefreshSessionStore;
import com.example.studystreak.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshSessionStore sessions;
    private final RefreshTokenHasher hasher;

    public AuthService(UserRepository userRepository, JwtService jwtService,
                       PasswordEncoder passwordEncoder, RefreshSessionStore sessions,
                       RefreshTokenHasher hasher) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
        this.hasher = hasher;
    }

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {
        User user = userRepository.findByUsername(loginRequestDTO.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));
        if (!passwordEncoder.matches(loginRequestDTO.getPassword(), user.getPassword())
                || !Boolean.TRUE.equals(user.getActive())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        UUID sessionId = UUID.randomUUID();
        String refresh = jwtService.generateRefreshToken(user, sessionId);
        sessions.create(sessionId, user.getId(), hasher.hash(jwtService.extractRefreshTokenId(refresh)),
                jwtService.extractExpiration(refresh).toInstant());
        return new LoginResponseDTO(jwtService.generateToken(user), refresh);
    }

    @Transactional
    public LoginResponseDTO refresh(String refreshToken) {
        try {
            User user = userRepository.findByUsername(jwtService.extractUsername(refreshToken))
                    .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
            if (!jwtService.isRefreshTokenValid(refreshToken, user)) {
                throw new BadCredentialsException("Invalid refresh token");
            }
            UUID sessionId = UUID.fromString(jwtService.extractRefreshSessionId(refreshToken));
            String oldTokenId = jwtService.extractRefreshTokenId(refreshToken);
            if (oldTokenId == null) {
                throw new BadCredentialsException("Invalid refresh token");
            }

            String nextRefresh = jwtService.generateRefreshToken(user, sessionId);
            String nextTokenId = jwtService.extractRefreshTokenId(nextRefresh);
            boolean rotated = sessions.rotate(sessionId, user.getId(), hasher.hash(oldTokenId),
                    hasher.hash(nextTokenId), jwtService.extractExpiration(nextRefresh).toInstant());
            if (!rotated) {
                // An already-consumed, revoked, or expired refresh token cannot be replayed.
                throw new BadCredentialsException("Invalid refresh token");
            }
            return new LoginResponseDTO(jwtService.generateToken(user), nextRefresh);
        } catch (BadCredentialsException ex) {
            throw ex;
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException ex) {
            throw new BadCredentialsException("Invalid refresh token");
        }
    }

    /** Revoke the currently held refresh token. Access JWTs expire on their regular schedule. */
    @Transactional
    public void logout(String refreshToken) {
        try {
            User user = userRepository.findByUsername(jwtService.extractUsername(refreshToken))
                    .orElse(null);
            if (user != null && jwtService.isRefreshTokenValid(refreshToken, user)) {
                UUID sessionId = UUID.fromString(jwtService.extractRefreshSessionId(refreshToken));
                sessions.revoke(sessionId, user.getId(),
                        hasher.hash(jwtService.extractRefreshTokenId(refreshToken)));
            }
        } catch (IllegalArgumentException ignored) {
            // Malformed JWTs and unknown sessions are treated as already logged out.
        } catch (io.jsonwebtoken.JwtException ignored) {
            // Malformed or expired tokens cannot revoke another session.
        }
    }
}
