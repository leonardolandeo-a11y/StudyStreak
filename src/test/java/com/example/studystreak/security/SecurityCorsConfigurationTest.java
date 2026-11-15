package com.example.studystreak.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;

class SecurityCorsConfigurationTest {

    @Test
    void productionOriginsAreExplicitAndForeignOriginsAreRejected() {
        var security = new SecurityConfig(null, null);
        ReflectionTestUtils.setField(security, "allowedOrigins", "https://app.example.test, https://preview.example.test");
        var source = (UrlBasedCorsConfigurationSource) security.corsConfigurationSource();
        var cors = source.getCorsConfiguration(new MockHttpServletRequest("OPTIONS", "/api/profile"));

        assertNotNull(cors);
        assertEquals("https://app.example.test", cors.checkOrigin("https://app.example.test"));
        assertEquals("https://preview.example.test", cors.checkOrigin("https://preview.example.test"));
        assertNull(cors.checkOrigin("https://untrusted.example.test"));
        assertNull(cors.checkOrigin("http://app.example.test"));
        assertTrue(cors.getAllowedMethods().contains("OPTIONS"));
        assertTrue(cors.getAllowedMethods().contains("POST"));
        assertTrue(cors.getAllowedHeaders().contains("Authorization"));
        assertTrue(cors.getAllowedHeaders().contains("Content-Type"));
        assertEquals(Boolean.TRUE, cors.getAllowCredentials());
    }

    @Test
    void localDevelopmentAllowsConfiguredLocalhostPortsOnly() {
        var security = new SecurityConfig(null, null);
        ReflectionTestUtils.setField(security, "allowedOrigins", "http://localhost:*");
        var source = (UrlBasedCorsConfigurationSource) security.corsConfigurationSource();
        var cors = source.getCorsConfiguration(new MockHttpServletRequest("OPTIONS", "/login"));

        assertNotNull(cors);
        assertEquals("http://localhost:5173", cors.checkOrigin("http://localhost:5173"));
        assertNull(cors.checkOrigin("https://app.example.test"));
    }
}
