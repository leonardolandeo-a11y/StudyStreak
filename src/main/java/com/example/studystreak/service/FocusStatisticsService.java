package com.example.studystreak.service;

import com.example.studystreak.dto.Focus.FocusStatisticsDTO;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.FocusSessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FocusStatisticsService {
    private final CurrentUserService currentUserService;
    private final FocusSessionRepository repository;

    public FocusStatisticsService(CurrentUserService currentUserService,
                                  FocusSessionRepository repository) {
        this.currentUserService = currentUserService;
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public FocusStatisticsDTO getStatistics(int days) {
        if (days != 7 && days != 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "days must be 7 or 30");
        }

        User user = currentUserService.getCurrentUser();
        long userId = user.getId();
        ZoneId zone = StudyDatePolicy.zone(user);
        LocalDate today = LocalDate.now(zone);
        LocalDate first = today.minusDays(days - 1L);
        Instant since = first.atStartOfDay(zone).toInstant();

        Map<LocalDate, long[]> series = new HashMap<>();
        for (Object[] row : repository.aggregateDaily(userId, since, zone.getId())) {
            LocalDate date = LocalDate.parse(row[0].toString());
            if (date.isBefore(first) || date.isAfter(today)) continue;
            series.put(date, new long[]{((Number)row[1]).longValue(), ((Number)row[2]).longValue()});
        }

        List<FocusStatisticsDTO.DailyFocus> daily = new ArrayList<>(days);
        long periodMinutes = 0;
        long periodSessions = 0;
        long bestDayMinutes = 0;
        for (int i = 0; i < days; i++) {
            LocalDate date = first.plusDays(i);
            long[] value = series.getOrDefault(date, new long[2]);
            daily.add(new FocusStatisticsDTO.DailyFocus(date, value[0], value[1]));
            periodMinutes += value[0];
            periodSessions += value[1];
            bestDayMinutes = Math.max(bestDayMinutes, value[0]);
        }

        List<FocusStatisticsDTO.GoalFocus> byGoal = new ArrayList<>();
        for (Object[] group : repository.totalsByGoalForUser(userId)) {
            byGoal.add(new FocusStatisticsDTO.GoalFocus(
                    ((Number) group[0]).longValue(),
                    (String) group[1],
                    ((Number) group[2]).longValue(),
                    ((Number) group[3]).longValue()
            ));
        }

        return new FocusStatisticsDTO(
                days,
                repository.sumMinutesForUser(userId),
                repository.countForUser(userId),
                periodMinutes, periodSessions, bestDayMinutes, daily, byGoal
        );
    }
}
