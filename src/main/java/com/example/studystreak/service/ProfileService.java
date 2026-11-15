package com.example.studystreak.service;

import com.example.studystreak.dto.Profile.*;
import com.example.studystreak.repository.UserRepository;
import com.example.studystreak.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.MathContext;

@Service
public class ProfileService {
    private final CurrentUserService current;
    private final UserRepository users;
    private final StudyAnalyticsService analytics;
    private final JdbcTemplate db;

    public ProfileService(CurrentUserService current, UserRepository users, StudyAnalyticsService analytics, JdbcTemplate db) {
        this.current = current; this.users = users; this.analytics = analytics; this.db = db;
    }
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ProfileResponse get() { return response(current.getCurrentUser()); }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public ProfileResponse update(ProfileUpdateRequest patch) {
        // Validate the entire patch before changing any managed entity.
        String displayName = patch.hasDisplayName() ? ProfileText.displayName(patch.displayName()) : null;
        String bio = patch.hasBio() ? ProfileText.bio(patch.bio()) : null;
        User user = current.getCurrentUser();
        if (patch.hasDisplayName()) user.setDisplayName(displayName);
        if (patch.hasBio()) user.setBio(bio);
        users.saveAndFlush(user);
        return response(user);
    }
    private ProfileResponse response(User user) {
        var legacy = analytics.stats(7); // Reuse existing, unchanged streak semantics.
        var verified = db.queryForMap("""
            select coalesce(sum(confirmed_seconds),0) as seconds, count(*) as sessions
            from study_ledger where user_id=? and state='COMPLETE' and verified=true
              and source in ('INDIVIDUAL','GROUP')
            """, user.getId());
        var minutes = new BigDecimal(verified.get("seconds").toString()).divide(BigDecimal.valueOf(60), MathContext.DECIMAL128);
        long active = db.queryForObject("select count(*) from goal where user_id=? and completed=false", Long.class, user.getId());
        var statistics = new ProfileStatistics(((Number)legacy.get("studyStreak")).longValue(),
                ((Number)legacy.get("bestStudyStreak")).longValue(), minutes, ((Number)verified.get("sessions")).longValue(), active);
        return new ProfileResponse(user.getId(), user.getUsername(), user.getDisplayName(),
                user.getDisplayName() == null ? user.getUsername() : user.getDisplayName(), user.getBio(), statistics);
    }
}
