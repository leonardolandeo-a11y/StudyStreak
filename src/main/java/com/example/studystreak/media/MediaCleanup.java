package com.example.studystreak.media;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.data.domain.PageRequest;
@Component
public class MediaCleanup {
    private final RetiredMediaRoomRepository retired;
    private final MediaConfiguration config;
    private final LiveKitGateway gateway;
    private int page;
    public MediaCleanup(RetiredMediaRoomRepository retired,MediaConfiguration config,LiveKitGateway gateway) {
        this.retired=retired;this.config=config;this.gateway=gateway;
    }
    @Scheduled(fixedDelay=5000, scheduler="mediaScheduler")
    public void clean() {
        if (!config.ready()) return;
        var batch=retired.findAll(PageRequest.of(page,25));
        for (var room:batch) {
            try { gateway.retire(room.getName()); }
            catch (Exception failure) {
                if (failure instanceof InterruptedException) Thread.currentThread().interrupt();
                org.slf4j.LoggerFactory.getLogger(getClass()).warn("Media cleanup unavailable; will retry retired rooms");
                return;
            }
        }
        page=batch.hasNext()?page+1:0;
        // Keep tombstones: self-hosted LiveKit may refresh credentials for a rejoined old room.
    }
}
