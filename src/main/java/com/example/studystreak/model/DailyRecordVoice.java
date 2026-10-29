package com.example.studystreak.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "daily_record_voice")
public class DailyRecordVoice {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "daily_record_id", nullable = false, unique = true)
    private DailyRecord dailyRecord;

    @Column(name = "audio_data", nullable = false, columnDefinition = "bytea")
    private byte[] audioData;

    protected DailyRecordVoice() {}

    public DailyRecordVoice(DailyRecord dailyRecord, byte[] audioData) {
        this.dailyRecord = dailyRecord;
        this.audioData = audioData;
    }
}
