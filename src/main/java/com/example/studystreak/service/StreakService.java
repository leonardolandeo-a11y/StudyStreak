package com.example.studystreak.service;

import com.example.studystreak.dto.Streak.StreakDTO;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.Streak;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.StreakRepository;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class StreakService {

    private final StreakRepository streakRepository;
    private final GoalRepository goalRepository;
    private final DailyRecordRepository dailyRecordRepository;
    private final ModelMapper modelMapper;

    /*
     * Se usa para comprobar que el Goal pertenece
     * al usuario autenticado cuando se accede
     * desde los endpoints de Streak.
     */
    private final CurrentUserService currentUserService;

    public StreakService(
            StreakRepository streakRepository,
            GoalRepository goalRepository,
            DailyRecordRepository dailyRecordRepository,
            ModelMapper modelMapper,
            CurrentUserService currentUserService
    ) {

        this.streakRepository = streakRepository;
        this.goalRepository = goalRepository;
        this.dailyRecordRepository = dailyRecordRepository;
        this.modelMapper = modelMapper;
        this.currentUserService = currentUserService;
    }


    /*
     * Comprueba que:
     *
     * 1. El Goal exista.
     * 2. El Goal pertenezca al usuario autenticado.
     *
     * Este método se utiliza únicamente para las operaciones
     * expuestas al usuario mediante los endpoints.
     */
    private Goal getOwnedGoal(Long goalId) {

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Goal not found with id: " + goalId
                        )
                );

        Long currentUserId =
                currentUserService.getCurrentUserId();

        if (!goal.getUser().getId().equals(currentUserId)) {

            throw new ForbiddenException(
                    "You cannot access streak for goal with id: "
                            + goalId
            );
        }

        return goal;
    }


    /*
     * GET /api/goals/{goalId}/streak
     *
     * Solo el dueño del Goal puede consultar su racha
     * mediante este endpoint.
     */
    public StreakDTO getGoalStreak(Long goalId) {

        getOwnedGoal(goalId);

        return streakRepository
                .findByGoalId(goalId)
                .map(streak ->
                        modelMapper.map(
                                streak,
                                StreakDTO.class
                        )
                )
                .orElseGet(() ->
                        recalculateStreak(goalId)
                );
    }


    /*
     * Método utilizado específicamente por el endpoint
     * POST /recalculate.
     *
     * Primero comprueba ownership y después delega
     * al método normal de recálculo.
     */
    @Transactional
    public StreakDTO recalculateOwnedStreak(Long goalId) {

        getOwnedGoal(goalId);

        return recalculateStreak(goalId);
    }


    /*
     * Método de recálculo interno.
     *
     * IMPORTANTE:
     *
     * Este método NO comprueba CurrentUser.
     *
     * ValidationService necesita poder llamarlo después
     * de que un compañero valide un DailyRecord.
     *
     * Si comprobáramos ownership aquí, esa operación
     * fallaría porque el usuario autenticado sería
     * el validator y no el dueño del Goal.
     */
    @Transactional
    public StreakDTO recalculateStreak(Long goalId) {

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Goal not found with id: " + goalId
                        )
                );

        List<LocalDate> approvedDates =
                getApprovedDates(goalId);

        int currentStreak =
                calculateCurrentStreak(approvedDates);

        int bestStreak =
                calculateBestStreak(approvedDates);

        Streak streak =
                streakRepository
                        .findByGoalId(goalId)
                        .orElse(
                                new Streak(
                                        0,
                                        0,
                                        null,
                                        goal
                                )
                        );

        streak.setCurrentStreak(currentStreak);
        streak.setBestStreak(bestStreak);
        streak.setLastUpdateDate(LocalDate.now());

        streak = streakRepository.save(streak);

        return modelMapper.map(
                streak,
                StreakDTO.class
        );
    }


    /*
     * Obtiene únicamente las fechas que:
     *
     * - no sean futuras
     * - tengan Validation
     * - hayan sido aprobadas
     */
    private List<LocalDate> getApprovedDates(Long goalId) {

        List<DailyRecord> dailyRecords =
                dailyRecordRepository.findByGoalId(goalId);

        LocalDate today =
                LocalDate.now();

        return dailyRecords.stream()
                .filter(record ->
                        record.getDate() != null
                                && !record.getDate().isAfter(today)
                                && record.getValidation() != null
                                && Boolean.TRUE.equals(
                                record
                                        .getValidation()
                                        .getApproved()
                        )
                )
                .map(DailyRecord::getDate)
                .distinct()
                .sorted()
                .toList();
    }


    private int calculateBestStreak(
            List<LocalDate> dates
    ) {

        if (dates.isEmpty()) {
            return 0;
        }

        int current = 1;
        int best = 1;

        for (int i = 1; i < dates.size(); i++) {

            LocalDate previousDate =
                    dates.get(i - 1);

            LocalDate currentDate =
                    dates.get(i);

            if (currentDate.equals(
                    previousDate.plusDays(1))) {

                current++;

            } else {

                current = 1;
            }

            if (current > best) {
                best = current;
            }
        }

        return best;
    }


    private int calculateCurrentStreak(
            List<LocalDate> dates
    ) {

        if (dates.isEmpty()) {
            return 0;
        }

        LocalDate today =
                LocalDate.now();

        LocalDate lastDate =
                dates.get(dates.size() - 1);

        /*
         * Si la última actividad válida ocurrió antes
         * de ayer, la racha actual ya terminó.
         */
        if (lastDate.isBefore(
                today.minusDays(1))) {

            return 0;
        }

        int current = 1;

        for (int i = dates.size() - 1;
             i > 0;
             i--) {

            LocalDate currentDate =
                    dates.get(i);

            LocalDate previousDate =
                    dates.get(i - 1);

            if (currentDate.equals(
                    previousDate.plusDays(1))) {

                current++;

            } else {

                break;
            }
        }

        return current;
    }
}