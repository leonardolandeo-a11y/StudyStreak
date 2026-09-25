package com.example.studystreak.service;

import com.example.studystreak.event.UserRegisteredEvent;
import com.example.studystreak.dto.User.UserRequestDTO;
import com.example.studystreak.dto.User.UserResponseDTO;
import com.example.studystreak.dto.User.UserUpdateRequestDTO;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.studystreak.model.Role;

import java.time.LocalDate;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;
    /*
    ApplicationEventPublisher es una interfaz de Spring que permite publicar eventos mediante publisEvent()

     */
    private final ApplicationEventPublisher eventPublisher;

    public UserService(UserRepository userRepository,ModelMapper modelMapper, PasswordEncoder passwordEncoder,
                                                                            ApplicationEventPublisher eventPublisher){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.modelMapper = modelMapper;
        this.eventPublisher = eventPublisher;
    }

    public UserResponseDTO createUser(UserRequestDTO userRequestDTO) {

        User user = modelMapper.map(
                userRequestDTO,
                User.class
        );

        user.setRegistrationDate(LocalDate.now());
        user.setActive(true);
        user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword())); // Encode the password using passwordEncoder
        user = userRepository.save(user);
        //Se dispara el evento de Registro del user
        eventPublisher.publishEvent(new UserRegisteredEvent(user.getEmail(),user.getUsername()));
        return modelMapper.map(user, UserResponseDTO.class);
    }

    public UserResponseDTO getUserById(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return modelMapper.map(user, UserResponseDTO.class);
    }

    public UserResponseDTO updateUserDetails(Long userId, UserUpdateRequestDTO request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (request.getUsername() != null) {user.setUsername(request.getUsername());}
        if (request.getEmail() != null) {user.setEmail(request.getEmail());}
        if (request.getTimeZone() != null) {user.setTimeZone(request.getTimeZone());}

        User updatedUser = userRepository.save(user);
        return modelMapper.map(updatedUser, UserResponseDTO.class);
    }

    public void deleteUser(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        userRepository.delete(user);
    }
}