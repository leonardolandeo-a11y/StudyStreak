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
        // Exception (Not implemented yet)
        // matches (raw_password, encoded_password)
        if (!passwordEncoder.matches(loginRequestDTO.getPassword(),user.getPassword())){  // Compare the passwords
            throw new BadCredentialsException("Invalid username or password");
        }
        String token  = jwtService.generateToken(user); // Create the token with respect the username
        return new LoginResponseDTO(token);   // Return the LoginResponseDTO token
    }
}
