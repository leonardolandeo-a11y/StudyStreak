package com.example.studystreak.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "goal")
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    private String topic;
    private Integer frequency;
    private Integer duration;

    @ManyToOne
    @JoinColumn(name = "user_id",nullable = false)
    private User user;

    @OneToMany(mappedBy = "goal")
    private List<DailyRecord> dailyRecords;

    @OneToOne(mappedBy = "goal")
    private Streak streak;

    @ManyToMany(mappedBy = "goals")
    private List<Tag> tags;

    protected Goal(){}

}
