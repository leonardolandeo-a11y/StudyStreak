package com.example.studystreak.dto.Books;

import java.util.List;

public record StudyBookDTO(
        String id,
        String title,
        List<String> authors,
        String publishedDate,
        String description,
        String infoLink,
        String thumbnailUrl,
        String previewLink,
        String publisher,
        Integer pageCount,
        List<String> categories
) {}
