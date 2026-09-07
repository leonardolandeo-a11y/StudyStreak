package com.example.studystreak.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    private String username;

    @Column(unique = true, nullable = false)
    private String email;
    @Column(nullable = false)
    private String password;
    private Boolean active;
    private LocalDate registrationDate;
    private String timeZone;

    @OneToMany(mappedBy = "user")
    private List<Goal> goals;

    protected User(){};

    public User(String username, String email, String password, Boolean active, LocalDate registrationDate, String timeZone) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.active = active;
        this.registrationDate = registrationDate;
        this.timeZone = timeZone;
    }
}
