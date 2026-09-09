package com.example.studystreak.service;

import com.example.studystreak.dto.User.UserRequestDTO;
import com.example.studystreak.dto.User.UserResponseDTO;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;


@Service
public class UserService {
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    public UserService(UserRepository userRepository,ModelMapper modelMapper){
        this.userRepository = userRepository;
        this.modelMapper = modelMapper;
    }
    public UserResponseDTO createUser(UserRequestDTO userRequestDTO){
        User user = modelMapper.map(userRequestDTO, User.class);
        user.setRegistrationDate(LocalDate.now());
        user.setActive(true);

        user = userRepository.save(user);
        return modelMapper.map(user, UserResponseDTO.class);
    }
    public UserResponseDTO getUserById(Long userId){
        User user = userRepository.findById(userId).orElseThrow(); // Exception (No implemented yet)
        return modelMapper.map(user, UserResponseDTO.class);
    }

    public UserResponseDTO updateUser(Long userId, UserRequestDTO userRequestDTO){
        User user = userRepository.findById(userId).orElseThrow(); // Exception (No implemented yet)
        user.setEmail(userRequestDTO.getEmail());
        user.setPassword(userRequestDTO.getPassword());
        user.setUsername(userRequestDTO.getUsername());
        user.setTimeZone(userRequestDTO.getTimeZone());

        userRepository.save(user);
        return modelMapper.map(user, UserResponseDTO.class);
    }
    public void deleteUser(Long userId){
        User user = userRepository.findById(userId).orElseThrow(); // Exception (No implemented yet)
        userRepository.delete(user);
    }
}
