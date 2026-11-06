package com.example.studystreak.media;
import jakarta.persistence.*;
@Entity
@Table(name = "retired_media_room")
public class RetiredMediaRoom {
    @Id @Column(length=100) private String name;
    protected RetiredMediaRoom() {}
    public RetiredMediaRoom(String name) { this.name = name; }
    public String getName() { return name; }
}
