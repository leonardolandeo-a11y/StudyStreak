package com.example.studystreak.security;

import com.example.studystreak.model.Role;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import com.example.studystreak.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtRequestFilterTest {
    private final JwtService jwtService = mock(JwtService.class);
    private final UserRepository repository = mock(UserRepository.class);
    private final JwtRequestFilter filter = new JwtRequestFilter(jwtService, repository);
    private final HttpServletRequest request = mock(HttpServletRequest.class);
    private final HttpServletResponse response = mock(HttpServletResponse.class);
    private final FilterChain chain = mock(FilterChain.class);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void validAccessTokenAuthenticatesActiveDatabaseAccount() throws Exception {
        User user = user(true);
        when(jwtService.isTokenValid("access-token", user)).thenReturn(true);

        filter.doFilterInternal(request, response, chain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("learner", SecurityContextHolder.getContext().getAuthentication().getName());
        verify(chain).doFilter(request, response);
    }

    @Test
    void disabledAccountIsNeverAuthenticated() throws Exception {
        User user = user(false);
        when(jwtService.isTokenValid("access-token", user)).thenReturn(true);

        filter.doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(jwtService, never()).isTokenValid(anyString(), any(User.class));
        verify(chain).doFilter(request, response);
    }

    @Test
    void tokenWithDifferentAccountIdCannotAuthenticate() throws Exception {
        User user = user(true);
        when(jwtService.isTokenValid("access-token", user)).thenReturn(false);

        filter.doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(request, response);
    }

    private User user(boolean active) {
        when(request.getHeader("Authorization")).thenReturn("Bearer access-token");
        when(jwtService.extractUsername("access-token")).thenReturn("learner");
        User user = mock(User.class);
        when(user.getActive()).thenReturn(active);
        when(user.getUsername()).thenReturn("learner");
        when(user.getRole()).thenReturn(Role.USER);
        when(user.getPassword()).thenReturn("encoded");
        when(repository.findByUsername("learner")).thenReturn(Optional.of(user));
        return user;
    }
}
