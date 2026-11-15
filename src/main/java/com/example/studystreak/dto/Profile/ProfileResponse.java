package com.example.studystreak.dto.Profile;

public record ProfileResponse(Long id, String username, String displayName,
                              String presentationName, String bio, ProfileStatistics statistics) {}
