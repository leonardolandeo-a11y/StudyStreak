package com.example.studystreak.controller;

import com.example.studystreak.dto.Tag.TagRequestDTO;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.service.CurrentUserService;
import com.example.studystreak.service.TagService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class TagControllerAccessTest {
    private final TagService tags = mock(TagService.class);
    private final CurrentUserService current = mock(CurrentUserService.class);
    private final TagController controller = new TagController(tags, current);

    @Test
    void listRejectsMismatchedUserId() {
        when(current.getCurrentUserId()).thenReturn(7L);

        assertThrows(ForbiddenException.class,
                () -> controller.getGoalTags(8L, 19L, Pageable.unpaged()));
        verifyNoInteractions(tags);
    }

    @Test
    void updateRejectsMismatchedUserId() {
        when(current.getCurrentUserId()).thenReturn(7L);

        assertThrows(ForbiddenException.class,
                () -> controller.updateTag(mock(TagRequestDTO.class), 8L, 20L, 19L));
        verifyNoInteractions(tags);
    }

    @Test
    void deleteRejectsMismatchedUserId() {
        when(current.getCurrentUserId()).thenReturn(7L);

        assertThrows(ForbiddenException.class,
                () -> controller.removeTagFromGoal(8L, 19L, 20L));
        verifyNoInteractions(tags);
    }
}
