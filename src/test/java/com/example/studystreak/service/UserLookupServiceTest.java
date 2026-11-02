package com.example.studystreak.service;

import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserLookupServiceTest {
    @Test
    void searchesActiveUsersWithoutExposingEmail() {
        UserRepository repository = mock(UserRepository.class);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        User user = mock(User.class);
        when(currentUserService.getCurrentUserId()).thenReturn(7L);
        when(user.getId()).thenReturn(8L);
        when(user.getUsername()).thenReturn("studyPartner");
        when(repository.searchActiveUsers(eq("study"), eq(7L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(user)));

        var result = new UserLookupService(repository, currentUserService).searchUsers(" study ", 0);

        assertEquals(1, result.getContent().size());
        assertEquals(8L, result.getContent().getFirst().id());
        assertEquals("studyPartner", result.getContent().getFirst().username());
        verify(repository).searchActiveUsers(eq("study"), eq(7L), any(Pageable.class));
    }

    @Test
    void rejectsIncompleteOrUnsafeSearches() {
        UserLookupService service = new UserLookupService(mock(UserRepository.class), mock(CurrentUserService.class));
        assertThrows(IllegalArgumentException.class, () -> service.searchUsers("a", 0));
        assertThrows(IllegalArgumentException.class, () -> service.searchUsers("%", 0));
        assertThrows(IllegalArgumentException.class, () -> service.searchUsers("study", -1));
    }
}
