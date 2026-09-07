package com.example.studystreak.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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

    protected Goal(){}
}
