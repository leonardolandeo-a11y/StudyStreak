package com.example.studystreak.collaboration;
import jakarta.persistence.*;
import lombok.Getter;
import java.time.Instant;
import java.util.UUID;
@Getter @Entity
@Table(name="study_room_message",indexes=@Index(name="idx_room_message_time",columnList="roomId,createdAt"))
public class RoomMessage {
    @Id private UUID id;
    @com.fasterxml.jackson.annotation.JsonIgnore @Version private Long version;
    @Column(nullable=false) private UUID roomId;
    @Column(nullable=false) private Long authorId;
    @Column(nullable=false,length=100) private String authorName;
    @Column(nullable=false,length=1000) private String text;
    @Column(nullable=false) private Instant createdAt;
    private boolean removed;
    protected RoomMessage() {}
    public RoomMessage(UUID id,UUID roomId,Long authorId,String name,String text) {
        this.id=id;this.roomId=roomId;this.authorId=authorId;this.authorName=name;this.text=text;createdAt=Instant.now();
    }
    public void remove() { text="Message removed by host";removed=true; }
}
