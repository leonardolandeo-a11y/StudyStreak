package com.example.studystreak.dto.Room;

/** Null means presence only; only explicit user actions change study status. */
public record StudyRoomHeartbeat(Boolean studying) {}
