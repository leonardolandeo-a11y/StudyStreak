package com.example.studystreak.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GoogleBooksServiceTest {
    private final GoogleBooksService service = new GoogleBooksService(new ObjectMapper(), "");

    @Test
    void mapsBookDetailsAndNormalizesGoogleLinks() {
        String json = """
                {"items":[{"id":"abc","volumeInfo":{
                  "title":"Clean Code", "authors":["Robert C. Martin"],
                  "publishedDate":"2008", "description":"<b>Readable</b> code",
                  "publisher":"Prentice Hall", "pageCount":464,
                  "categories":["Computers"],
                  "imageLinks":{"thumbnail":"http://books.google.com/books/content?id=abc"},
                  "previewLink":"http://books.google.com/books?id=abc&pg=PP1"}}]}
                """;
        var books = service.parseBooks(json);
        assertEquals(1, books.size());
        var book = books.getFirst();
        assertEquals("Clean Code", book.title());
        assertEquals("Robert C. Martin", book.authors().getFirst());
        assertEquals("Readable code", book.description());
        assertEquals("Prentice Hall", book.publisher());
        assertEquals(464, book.pageCount());
        assertEquals("Computers", book.categories().getFirst());
        assertEquals("https://books.google.com/books?id=abc", book.infoLink());
        assertEquals("https://books.google.com/books/content?id=abc", book.thumbnailUrl());
        assertEquals("https://books.google.com/books?id=abc&pg=PP1", book.previewLink());
    }

    @Test
    void rejectsUntrustedGoogleDataLinks() {
        var books = service.parseBooks("""
                {"items":[{"id":"abc","volumeInfo":{"title":"A Book",
                  "imageLinks":{"thumbnail":"https://example.com/tracker.png"},
                  "previewLink":"javascript:alert(1)"}}]}
                """);
        assertNull(books.getFirst().thumbnailUrl());
        assertNull(books.getFirst().previewLink());
        assertEquals("https://books.google.com/books?id=abc", books.getFirst().infoLink());
        assertNull(books.getFirst().pageCount());
    }

    @Test
    void emptyResultReturnsEmptyList() {
        assertEquals(0, service.parseBooks("{\"totalItems\":0}").size());
    }

    @Test
    void missingKeyFailsWithoutCallingGoogle() {
        var ex = assertThrows(GoogleBooksService.BookSearchException.class,
                () -> service.search("differential equations"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
    }

    @Test
    void upstreamAuthFailuresIndicateConfigurationInsteadOfTemporaryOutage() {
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
                GoogleBooksService.classifyUpstreamFailure(403).getStatus());
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
                GoogleBooksService.classifyUpstreamFailure(401).getStatus());
    }

    @Test
    void quotaAndTransientErrorsKeepDistinctStatuses() {
        assertEquals(HttpStatus.TOO_MANY_REQUESTS,
                GoogleBooksService.classifyUpstreamFailure(429).getStatus());
        assertEquals(HttpStatus.BAD_GATEWAY,
                GoogleBooksService.classifyUpstreamFailure(503).getStatus());
        assertEquals(HttpStatus.BAD_GATEWAY,
                GoogleBooksService.classifyUpstreamFailure(400).getStatus());
    }

    @Test
    void validationRejectsInvalidSearch() {
        assertThrows(IllegalArgumentException.class, () -> service.search("x"));
    }
}
