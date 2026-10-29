package com.example.studystreak.dto.DailyRecord;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DailyRecordRequestDTO {

    // Optional for backward compatibility: ignored on creation, immutable on update.
    private LocalDate date;

    @Size(max = 1000, message = "La nota no puede superar los 1000 caracteres")
    private String note;

    private String evidence;

    public DailyRecordRequestDTO() {}
}