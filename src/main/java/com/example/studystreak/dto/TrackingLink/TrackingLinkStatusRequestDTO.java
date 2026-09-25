package com.example.studystreak.dto.TrackingLink;

import com.example.studystreak.model.TrackingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TrackingLinkStatusRequestDTO {

    @NotNull(message = "Tracking status is required")
    private TrackingStatus status;

    public TrackingLinkStatusRequestDTO() {}
}