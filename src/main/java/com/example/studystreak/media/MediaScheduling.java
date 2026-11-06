package com.example.studystreak.media;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
@Configuration
public class MediaScheduling {
    @Bean public ThreadPoolTaskScheduler taskScheduler() {
        var scheduler=new ThreadPoolTaskScheduler(); scheduler.setPoolSize(2);
        scheduler.setThreadNamePrefix("study-scheduled-"); return scheduler;
    }
    @Bean public ThreadPoolTaskScheduler mediaScheduler() {
        var scheduler=new ThreadPoolTaskScheduler(); scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("media-cleanup-"); return scheduler;
    }
}
