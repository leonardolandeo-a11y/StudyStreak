package com.example.studystreak.dto.DailyRecord;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DailyRecordDTO {
    private LocalDate date;
    private String note;
    private String evidence;
    protected DailyRecordDTO(){}
}
