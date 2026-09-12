package com.example.studystreak.repository;

import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.TrackingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrackingLinkRepository extends JpaRepository<TrackingLink,Long> {
    @Query("SELECT t FROM TrackingLink t WHERE " +
                "(t.requester.id = :userId1 AND t.receiver.id = :userId2) OR " +
            "(t.requester.id = :userId2 AND t.receiver.id = :userId1)")
    Optional<TrackingLink> findLinkBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    /*
    @Query nos permite escribir consultas personalizadas, @Param le dice a Spring boot el nombre de las variables
    La condicional OR permite evaluar ambos escenarios:
    - Cuando el usuario 1 invito al 2
    - CUando el usuario 2 invito al 1
     */
    @Query("SELECT t FROM TrackingLink t WHERE t.requester.id = :userId OR t.receiver.id = :userId")
    List<TrackingLink> findLinksByUserId(@Param("userId") Long userId);
    //se explica solo, creo

    //Spring Boot genera el query method por el nombre
    List<TrackingLink> findByReceiverIdAndStatus(Long receiverId, TrackingStatus status);

    @Query("SELECT t FROM TrackingLink t WHERE " +
            "(t.requester.id = :userId OR t.receiver.id = :userId) AND t.status=':status'")
    List<TrackingLink> findLinksByUserIdAndStatus(@Param("userId1") Long userId1, @Param("status") TrackingStatus status);
}
