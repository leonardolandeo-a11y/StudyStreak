package com.example.studystreak.dto.DailyRecord;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DailyRecordRequestDTO {

    @NotNull(message = "La fecha es obligatoria")
    @PastOrPresent(message = "La fecha no puede ser futura")
    private LocalDate date;

    @Size(max = 1000, message = "La nota no puede superar los 1000 caracteres")
    private String note;

    private String evidence;

    public DailyRecordRequestDTO() {}
}