package com.example.studystreak.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
@Getter
@Setter
@Entity
@Table(name = "daily_record",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_daily_record_goal_date",
                        columnNames = {"goal_id", "date"}
                )
        }
)
public class DailyRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;
    @Column(nullable = false)
    private LocalDate date;

    private String note;
    private String evidence;

    @ManyToOne
    @JoinColumn(name = "goal_id",nullable = false)
    private Goal goal;

    @OneToOne(mappedBy = "dailyRecord")
    private Validation validation;

    protected DailyRecord(){}

    public DailyRecord(LocalDate date, String note, String evidence, Goal goal) {
        this.date = date;
        this.note = note;
        this.evidence = evidence;
        this.goal = goal;
    }
}
