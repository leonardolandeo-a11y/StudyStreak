package com.example.studystreak.controller;

import com.example.studystreak.dto.User.UserRequestDTO;
import com.example.studystreak.dto.User.UserResponseDTO;
import com.example.studystreak.dto.User.UserUpdateRequestDTO;
import com.example.studystreak.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService){
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> createUser(
            @RequestBody UserRequestDTO user) {

        UserResponseDTO createdUser = userService.createUser(user);

        return ResponseEntity .status(HttpStatus.CREATED).body(createdUser);
    }

    @GetMapping("/{userID}")
    public ResponseEntity<UserResponseDTO> getUser(
            @PathVariable Long userID) {

        UserResponseDTO user = userService.getUserById(userID);

        return ResponseEntity.ok(user);
    }

    @PutMapping("/{userID}")
    public ResponseEntity<UserResponseDTO> updateUser(
            @PathVariable Long userID,
            @RequestBody UserRequestDTO userRequestDTO) {

        UserResponseDTO updatedUser = userService.updateUser(userID, userRequestDTO);

        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{userID}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userID) {

        userService.deleteUser(userID);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userID}")
    public ResponseEntity<UserResponseDTO> updateUserDetails(
            @PathVariable Long userID,
            @RequestBody UserUpdateRequestDTO userUpdateRequestDTO) {

        UserResponseDTO updatedUser = userService.updateUserDetails(
                        userID,
                        userUpdateRequestDTO
                );

        return ResponseEntity.ok(updatedUser);
    }
}