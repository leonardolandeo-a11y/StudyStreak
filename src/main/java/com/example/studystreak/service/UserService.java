package com.example.studystreak.service;

import com.example.studystreak.dto.User.UserRequestDTO;
import com.example.studystreak.dto.User.UserResponseDTO;
import com.example.studystreak.dto.User.UserUpdateRequestDTO;
import com.example.studystreak.event.UserRegisteredEvent;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.Role;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;

import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final CurrentUserService currentUserService;

    public UserService(
            UserRepository userRepository,
            ModelMapper modelMapper,
            PasswordEncoder passwordEncoder,
            ApplicationEventPublisher eventPublisher,
            CurrentUserService currentUserService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.modelMapper = modelMapper;
        this.eventPublisher = eventPublisher;
        this.currentUserService = currentUserService;
    }


    private void validateUserAccess(Long userId) {

        User currentUser = currentUserService.getCurrentUser();

        boolean isOwner = currentUser.getId().equals(userId);

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You cannot access resources of another user");
        }
    }


    @Transactional
    public UserResponseDTO createUser(UserRequestDTO userRequestDTO) {

        User user = modelMapper.map(userRequestDTO, User.class);

        user.setRegistrationDate(LocalDate.now());
        user.setActive(true);
        user.setRole(Role.USER);

        user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));

        User savedUser = userRepository.save(user);

        eventPublisher.publishEvent(new UserRegisteredEvent(savedUser.getEmail(), savedUser.getUsername()));

        return modelMapper.map(savedUser, UserResponseDTO.class);
    }


    public UserResponseDTO getUserById(Long userId) {

        validateUserAccess(userId);

        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return modelMapper.map(user, UserResponseDTO.class);
    }


    @Transactional
    public UserResponseDTO updateUserDetails(Long userId, UserUpdateRequestDTO request) {

        validateUserAccess(userId);

        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }

        if (request.getTimeZone() != null) {
            user.setTimeZone(request.getTimeZone());
        }

        User updatedUser = userRepository.save(user);

        return modelMapper.map(updatedUser, UserResponseDTO.class);
    }


    @Transactional
    public void deleteUser(Long userId) {

        validateUserAccess(userId);

        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        userRepository.delete(user);
    }
}