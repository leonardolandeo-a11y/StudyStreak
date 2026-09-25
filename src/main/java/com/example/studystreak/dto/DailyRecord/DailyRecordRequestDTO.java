package com.example.studystreak.dto.DailyRecord;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DailyRecordRequestDTO {

    private LocalDate date;
    private String note;
    private String evidence;

    public DailyRecordRequestDTO() {}
}