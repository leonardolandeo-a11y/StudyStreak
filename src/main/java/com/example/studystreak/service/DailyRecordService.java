package com.example.studystreak.service;

import com.example.studystreak.repository.DailyRecordRepository;
import org.springframework.stereotype.Service;

@Service
public class DailyRecordService {
    private final DailyRecordRepository dailyRecordRepository;

    public DailyRecordService(DailyRecordRepository dailyRecordRepository){
        this.dailyRecordRepository = dailyRecordRepository;
    }
}
