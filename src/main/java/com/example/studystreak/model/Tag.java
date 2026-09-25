package com.example.studystreak.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "tag")
public class Tag {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    private String name;

    @ManyToMany
    @JoinTable(
            name = "goal_tag",
            joinColumns = @JoinColumn(name = "tag_id"),
            inverseJoinColumns = @JoinColumn(name = "goal_id")
    )
    private List<Goal> goals = new ArrayList<>();
    protected Tag(){}

    public Tag(String name) {
        this.name = name;
    }
    public void addGoal(Goal goal) {
        if (!goals.contains((goal))) {
        goals.add(goal);
        }
    }

    public void removeGoal(Goal goal) {
        goals.remove(goal);
    }
}
