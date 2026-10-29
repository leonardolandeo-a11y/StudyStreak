package com.example.studystreak.repository;

import org.springframework.data.jpa.repository.Modifying;

import com.example.studystreak.model.DailyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface DailyRecordRepository
        extends JpaRepository<DailyRecord, Long> {

    List<DailyRecord> findByGoalId(Long goalId);
    //sobrecarga que devuelve los dailyrecords paginados
    Page<DailyRecord> findByGoalId(Long goalId, Pageable pageable);

    boolean existsByGoalIdAndDate(Long goalId, LocalDate date);

    long countByGoal_User_IdAndDateBetween(Long userId, LocalDate from, LocalDate to);

    @Query("select count(r) from DailyRecord r where r.goal.user.id = :userId and r.validation is null")
    long countAwaitingReviewByUserId(@Param("userId") Long userId);

    boolean existsByGoalIdAndDateAndIdNot(Long goalId, LocalDate date, Long dailyRecordId);

    // Bulk deletion avoids stale managed Validation -> DailyRecord references.
    // Clearing AFTER the SQL delete ensures streak recalculation reads fresh data.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from DailyRecord d where d.id = :recordId and d.goal.id = :goalId")
    int deleteOwnedRecord(@Param("goalId") Long goalId, @Param("recordId") Long recordId);

    @Modifying
    @Query("delete from DailyRecord d where d.goal.id = :goalId")
    int deleteForGoal(@Param("goalId") Long goalId);
}
