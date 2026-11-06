package com.example.studystreak.media;
import jakarta.persistence.*;
@Entity @Table(name="study_room_ban")
public class RoomBan {
    @Id @Column(length=80) private String id;
    protected RoomBan() {}
    public RoomBan(java.util.UUID room, long user) { id = room + ":" + user; }
}
