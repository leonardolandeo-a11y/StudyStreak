package com.example.studystreak;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.Async;

@org.springframework.scheduling.annotation.EnableScheduling
@SpringBootApplication
@Async
public class StudyStreakApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudyStreakApplication.class, args);
    }

}
