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

    public AuthService(UserRepository userRepository, JwtService jwtService, PasswordEncoder passwordEncoder){
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO){
        User user = userRepository.findByUsername(loginRequestDTO.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        // matches (raw_password, encoded_password)
        if (!passwordEncoder.matches(loginRequestDTO.getPassword(),user.getPassword())){  // Compare the passwords
            throw new BadCredentialsException("Invalid username or password");
        }

        String token = jwtService.generateToken(user); // Create the access token
        String refreshToken = jwtService.generateRefreshToken(user); // Create the refresh token

        return new LoginResponseDTO(token, refreshToken);
    }

    public LoginResponseDTO refresh(String refreshToken){

        try {
            String username = jwtService.extractUsername(refreshToken);

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

            if (!jwtService.isRefreshTokenValid(refreshToken, user.getUsername())) {
                throw new BadCredentialsException("Invalid refresh token");
            }

            String token = jwtService.generateToken(user);
            String newRefreshToken = jwtService.generateRefreshToken(user);

            return new LoginResponseDTO(token, newRefreshToken);

        } catch (BadCredentialsException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadCredentialsException("Invalid refresh token");
        }
    }
}