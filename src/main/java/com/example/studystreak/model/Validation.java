package com.example.studystreak.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "validation")
public class Validation {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    private Boolean approved;
    private String comment;

    @OneToOne
    @JoinColumn(name = "daily_record_id",nullable = false)
    private DailyRecord dailyRecord;

    @ManyToOne
    @JoinColumn(name = "user_id",nullable = false)
    private User validator;

    protected Validation(){}

    public Validation(Boolean approved, String comment, DailyRecord dailyRecord, User validator) {
        this.approved = approved;
        this.comment = comment;
        this.dailyRecord = dailyRecord;
        this.validator = validator;
    }
}
