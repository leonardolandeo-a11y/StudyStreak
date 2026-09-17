package com.example.studystreak.controller;


import com.example.studystreak.dto.User.UserRequestDTO;
import com.example.studystreak.dto.User.UserResponseDTO;
import com.example.studystreak.dto.User.UserUpdateRequestDTO;
import com.example.studystreak.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService){
        this.userService = userService;
    }
    @PostMapping
    public UserResponseDTO createUser(@RequestBody UserRequestDTO user ){
        return userService.createUser(user);
    }
    @GetMapping("/{userID}")
    public UserResponseDTO getUser(@PathVariable Long userID){
        return userService.getUserById(userID);
    }
    @PutMapping("/{userID}")
    public UserResponseDTO updateUser(@PathVariable Long userID, @RequestBody UserRequestDTO userResponseDTO){
        return userService.updateUser(userID, userResponseDTO);
    }
    @DeleteMapping("/{userID}")
    public void deleteUser(@PathVariable Long userID){
        userService.deleteUser(userID);
    }
    @PatchMapping("/{userID}")
    public UserResponseDTO updateUserDetails(@PathVariable Long userID, @RequestBody UserUpdateRequestDTO userUpdateRequestDTO){
        return userService.updateUserDetails(userID, userUpdateRequestDTO);
    }
}
