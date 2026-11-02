package com.example.studystreak.dto.DailyRecord;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DailyRecordResponseDTO {

    private Long id;
    private Long ownerUserId;
    private LocalDate date;
    private String note;
    private String evidence;
    private boolean photoAvailable;
    private boolean voiceAvailable;

    public DailyRecordResponseDTO() {}
}
