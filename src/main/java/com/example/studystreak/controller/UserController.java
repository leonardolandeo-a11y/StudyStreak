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

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> createUser(@RequestBody UserRequestDTO request) {

        UserResponseDTO user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponseDTO> getUser(@PathVariable Long userId) {

        return ResponseEntity.ok(userService.getUserById(userId));
    }

    /*
     * se comprobara que el usuario autenticado seael propietario de la cuenta o un administrador en el siguiente issue
     */
    @PatchMapping("/{userId}")
    public ResponseEntity<UserResponseDTO> updateUserDetails(
            @PathVariable Long userId,
            @RequestBody UserUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(
                userService.updateUserDetails(
                        userId,
                        request
                )
        );
    }

    /*
    se restringira al admin en el issue de security
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long userId
    ) {
        userService.deleteUser(userId);

        return ResponseEntity.noContent().build();
    }
}