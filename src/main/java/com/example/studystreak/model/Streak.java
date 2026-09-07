package com.example.studystreak.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
@Getter
@Setter
@Entity
@Table(name = "streak")
public class Streak {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    private Integer currentStreak;
    private Integer bestStreak;
    private LocalDate lastUpdateDate;

    @OneToOne
    @JoinColumn(name = "goal_id",nullable = false,unique = true)
    private Goal goal;
    protected Streak(){}

    public Streak(Integer currentStreak, Integer bestStreak, LocalDate lastUpdateDate, Goal goal) {
        this.currentStreak = currentStreak;
        this.bestStreak = bestStreak;
        this.lastUpdateDate = lastUpdateDate;
        this.goal = goal;
    }
}
