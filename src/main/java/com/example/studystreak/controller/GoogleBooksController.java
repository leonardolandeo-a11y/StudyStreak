package com.example.studystreak.controller;

import com.example.studystreak.service.GoogleBooksService;
import com.example.studystreak.service.GoogleBooksService.BookSearchException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/resources/books")
public class GoogleBooksController {
    private final GoogleBooksService booksService;

    public GoogleBooksController(GoogleBooksService booksService) {
        this.booksService = booksService;
    }

    @GetMapping
    public ResponseEntity<?> search(@RequestParam("q") String topic) {
        try {
            return ResponseEntity.ok(booksService.search(topic));
        } catch (BookSearchException exception) {
            return ResponseEntity.status(exception.getStatus())
                    .body(Map.of("message", exception.getMessage()));
        }
    }
}
