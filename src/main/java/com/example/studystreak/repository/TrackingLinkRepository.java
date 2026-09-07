package com.example.studystreak.repository;

import com.example.studystreak.model.TrackingLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrackingLinkRepository extends JpaRepository<TrackingLink,Long> {
}
