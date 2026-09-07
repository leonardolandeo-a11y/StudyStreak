package com.example.studystreak.service;

import org.springframework.stereotype.Service;

@Service
public class DailyRecordService {
    private final DailyRecordService dailyRecordService;

    public DailyRecordService(DailyRecordService dailyRecordService){
        this.dailyRecordService = dailyRecordService;
    }
}
