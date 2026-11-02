package com.example.studystreak.controller;

import com.example.studystreak.dto.User.UserResponseDTO;
import com.example.studystreak.dto.User.UserSearchResultDTO;
import com.example.studystreak.service.UserLookupService;
import com.example.studystreak.dto.User.UserUpdateRequestDTO;
import com.example.studystreak.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final UserLookupService userLookupService;

    public UserController(UserService userService, UserLookupService userLookupService) {
        this.userService = userService;
        this.userLookupService = userLookupService;
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UserSearchResultDTO>> searchUsers(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page
    ) {
        return ResponseEntity.ok(userLookupService.searchUsers(query, page));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponseDTO> getUser(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(
                userService.getUserById(userId)
        );
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<UserResponseDTO> updateUserDetails(
            @PathVariable Long userId,
            @Valid @RequestBody UserUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(
                userService.updateUserDetails(userId, request)
        );
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long userId
    ) {
        userService.deleteUser(userId);

        return ResponseEntity.noContent().build();
    }
}
