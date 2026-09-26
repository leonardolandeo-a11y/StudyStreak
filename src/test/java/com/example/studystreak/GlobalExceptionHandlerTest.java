package com.example.studystreak;

import com.example.studystreak.dto.ErrorResponseDTO;
import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler =
            new GlobalExceptionHandler();

    @Test
    void conflictShouldReturn409() {

        MockHttpServletRequest request =
                new MockHttpServletRequest();

        request.setRequestURI("/register");

        ResponseEntity<ErrorResponseDTO> response =
                handler.conflictHandler(
                        new ConflictException(
                                "Username already exists"
                        ),
                        request
                );

        assertEquals(
                409,
                response.getStatusCode().value()
        );

        assertNotNull(response.getBody());

        assertEquals(
                "Conflict",
                response.getBody().getError()
        );

        assertEquals(
                "/register",
                response.getBody().getPath()
        );
    }

    @Test
    void forbiddenShouldReturn403() {

        MockHttpServletRequest request =
                new MockHttpServletRequest();

        request.setRequestURI("/users/1/goals");

        ResponseEntity<ErrorResponseDTO> response =
                handler.forbiddenHandler(
                        new ForbiddenException(
                                "Access denied"
                        ),
                        request
                );

        assertEquals(
                403,
                response.getStatusCode().value()
        );

        assertNotNull(response.getBody());

        assertEquals(
                "Forbidden",
                response.getBody().getError()
        );
    }

    @Test
    void missingResourceShouldReturn404() {

        MockHttpServletRequest request =
                new MockHttpServletRequest();

        request.setRequestURI("/users/1/goals/999");

        ResponseEntity<ErrorResponseDTO> response =
                handler.notFoundHandler(
                        new ResourceNotFoundException(
                                "Goal not found"
                        ),
                        request
                );

        assertEquals(
                404,
                response.getStatusCode().value()
        );

        assertNotNull(response.getBody());

        assertEquals(
                "Not Found",
                response.getBody().getError()
        );

        assertNotNull(
                response.getBody().getTimestamp()
        );
    }
}