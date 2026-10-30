package com.example.studystreak.service;

import com.example.studystreak.dto.Auth.LoginRequestDTO;
import com.example.studystreak.dto.Auth.LoginResponseDTO;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {
        User user = userRepository.findByUsername(loginRequestDTO.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(loginRequestDTO.getPassword(), user.getPassword())
                || !Boolean.TRUE.equals(user.getActive())) {
            // Do not reveal whether the account exists or is disabled.
            throw new BadCredentialsException("Invalid username or password");
        }

        return new LoginResponseDTO(
                jwtService.generateToken(user),
                jwtService.generateRefreshToken(user)
        );
    }

    public LoginResponseDTO refresh(String refreshToken) {
        try {
            String username = jwtService.extractUsername(refreshToken);
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

            if (!Boolean.TRUE.equals(user.getActive())
                    || !jwtService.isRefreshTokenValid(refreshToken, user)) {
                throw new BadCredentialsException("Invalid refresh token");
            }

            return new LoginResponseDTO(
                    jwtService.generateToken(user),
                    jwtService.generateRefreshToken(user)
            );
        } catch (BadCredentialsException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadCredentialsException("Invalid refresh token");
        }
    }
}
