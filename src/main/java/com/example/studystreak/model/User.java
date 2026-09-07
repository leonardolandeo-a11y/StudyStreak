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


    @OneToMany(mappedBy="validator")
    private List<Validation> validations;

    @OneToMany(mappedBy = "requester")
    private List<TrackingLink> sentTrackingLinks;

    @OneToMany(mappedBy = "receiver")
    private List<TrackingLink> receivedTrackingLinks;

    @OneToMany(mappedBy = "user")
    private List<Notification> notifications;
    protected User(){};


}
