package com.example.studystreak.service;

import com.example.studystreak.event.UserRegisteredEvent;
import com.example.studystreak.dto.User.UserRequestDTO;
import com.example.studystreak.dto.User.UserResponseDTO;
import com.example.studystreak.dto.User.UserUpdateRequestDTO;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.studystreak.exceptions.ResourceNotFoundException;

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
        User user = modelMapper.map(userRequestDTO, User.class);
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

    public UserResponseDTO updateUser(Long userId, UserRequestDTO userRequestDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setEmail(userRequestDTO.getEmail());
        user.setPassword(passwordEncoder.encode(userRequestDTO.getPassword())); // Encode the password using passwordEncoder
        user.setUsername(userRequestDTO.getUsername());
        user.setTimeZone(userRequestDTO.getTimeZone());

        userRepository.save(user);
        return modelMapper.map(user, UserResponseDTO.class);
    }

    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        userRepository.delete(user);
    }

    public UserResponseDTO updateUserDetails(Long userID, UserUpdateRequestDTO userUpdateRequestDTO) {
        User user = userRepository.findById(userID)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userID));

        if (userUpdateRequestDTO.getUsername() != null) {
            user.setUsername(userUpdateRequestDTO.getUsername());
        }
        if (userUpdateRequestDTO.getEmail() != null) {
            user.setEmail(userUpdateRequestDTO.getEmail());
        }
        if (userUpdateRequestDTO.getTimeZone() != null) {
            user.setTimeZone(userUpdateRequestDTO.getTimeZone());
        }
        User updateUser = userRepository.save(user);
        return modelMapper.map(updateUser, UserResponseDTO.class);
    }
}
