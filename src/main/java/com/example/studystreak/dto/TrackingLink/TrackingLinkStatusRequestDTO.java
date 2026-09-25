package com.example.studystreak.dto.TrackingLink;

import com.example.studystreak.model.TrackingStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TrackingLinkStatusRequestDTO {

    private TrackingStatus status;

    public TrackingLinkStatusRequestDTO() {}
}