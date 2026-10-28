package com.example.studystreak.service;

import com.example.studystreak.dto.User.UserSearchResultDTO;
import com.example.studystreak.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserLookupService {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public UserLookupService(UserRepository userRepository, CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public Page<UserSearchResultDTO> searchUsers(String query, int page) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.length() < 2 || normalized.length() > 100 ||
                !normalized.matches("[\\p{L}\\p{N} ._@+'-]+")) {
            throw new IllegalArgumentException("Enter 2 to 100 characters of a username or email");
        }
        if (page < 0) {
            throw new IllegalArgumentException("Page number must be non-negative");
        }
        Long currentUserId = currentUserService.getCurrentUserId();
        return userRepository.searchActiveUsers(normalized, currentUserId, PageRequest.of(page, 8))
                .map(user -> new UserSearchResultDTO(user.getId(), user.getUsername()));
    }
}
