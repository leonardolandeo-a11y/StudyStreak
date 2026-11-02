package com.example.studystreak.service;

import com.example.studystreak.dto.User.UserRequestDTO;
import com.example.studystreak.dto.User.UserResponseDTO;
import com.example.studystreak.dto.User.UserUpdateRequestDTO;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceTimeZoneTest {
    private final UserRepository users = mock(UserRepository.class);
    private final ModelMapper mapper = mock(ModelMapper.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final CurrentUserService current = mock(CurrentUserService.class);

    private UserService service() {
        return new UserService(users, mapper, encoder, events, current, mock(UserDeletionService.class));
    }

    @Test
    void registrationRejectsUnknownTimeZoneBeforeSaving() {
        UserRequestDTO request = mock(UserRequestDTO.class);
        when(request.getTimeZone()).thenReturn("Mars/Phobos");

        assertThrows(IllegalArgumentException.class, () -> service().createUser(request));
        verifyNoInteractions(users, mapper, events);
    }

    @Test
    void registrationNormalizesValidTimeZone() {
        UserRequestDTO request = mock(UserRequestDTO.class);
        User user = mock(User.class);
        when(request.getTimeZone()).thenReturn("  America/Lima  ");
        when(mapper.map(request, User.class)).thenReturn(user);
        when(users.save(user)).thenReturn(user);
        UserResponseDTO response = mock(UserResponseDTO.class);
        when(mapper.map(user, UserResponseDTO.class)).thenReturn(response);

        service().createUser(request);
        verify(user).setTimeZone("America/Lima");
        verify(users).save(user);
    }

    @Test
    void profileUpdateRejectsInvalidTimeZoneWithoutSaving() {
        User user = mock(User.class);
        UserUpdateRequestDTO request = mock(UserUpdateRequestDTO.class);
        when(user.getId()).thenReturn(7L);
        when(current.getCurrentUser()).thenReturn(user);
        when(request.getTimeZone()).thenReturn("Not/AZone");

        assertThrows(IllegalArgumentException.class, () -> service().updateUserDetails(7L, request));
        verify(users, never()).save(any(User.class));
    }

    @Test
    void profileUpdateAcceptsValidTimeZone() {
        User user = mock(User.class);
        UserUpdateRequestDTO request = mock(UserUpdateRequestDTO.class);
        when(user.getId()).thenReturn(7L);
        when(current.getCurrentUser()).thenReturn(user);
        when(request.getTimeZone()).thenReturn("  America/Bogota ");
        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(users.save(user)).thenReturn(user);
        UserResponseDTO response = mock(UserResponseDTO.class);
        when(mapper.map(user, UserResponseDTO.class)).thenReturn(response);

        service().updateUserDetails(7L, request);
        verify(user).setTimeZone("America/Bogota");
        verify(users).save(user);
    }
}
