package com.example.studystreak.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutFilter;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class LogoutEndpointSecurityTest {

    @Autowired
    private SecurityFilterChain filterChain;

    @Test
    void jwtLogoutIsHandledByAuthControllerInsteadOfDefaultLogoutFilter() {
        assertTrue(filterChain.getFilters().stream().noneMatch(LogoutFilter.class::isInstance),
                "Default LogoutFilter must not intercept POST /logout");
        assertTrue(filterChain.getFilters().stream().anyMatch(JwtRequestFilter.class::isInstance),
                "JWT authentication filter must remain enabled");
    }
}
