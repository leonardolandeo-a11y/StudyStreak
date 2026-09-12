package com.example.studystreak.dto.TrackingLink;

import com.example.studystreak.model.TrackingStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TrackingLinkDTO {
    private Long id;
    private Long requesterId;
    private Long receiverId;
    private TrackingStatus status;

    protected TrackingLinkDTO(){}
}
