package com.example.studystreak.dto.TrackingLink;

import com.example.studystreak.model.TrackingStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TrackingLinkResponseDTO {

    private Long id;
    private Long requesterId;
    private Long receiverId;
    private TrackingStatus status;

    public TrackingLinkResponseDTO() {}
}