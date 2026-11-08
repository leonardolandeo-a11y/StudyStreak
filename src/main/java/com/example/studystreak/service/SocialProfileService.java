package com.example.studystreak.service;

import com.example.studystreak.dto.Social.SocialPrivacy;
import com.example.studystreak.model.User;
import com.example.studystreak.model.TrackingStatus;
import com.example.studystreak.repository.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;

@Service
public class SocialProfileService {
    private final CurrentUserService current;
    private final UserRepository users;
    private final TrackingLinkRepository tracking;
    private final JdbcTemplate db;
    public SocialProfileService(CurrentUserService current, UserRepository users, TrackingLinkRepository tracking, JdbcTemplate db) {
        this.current=current; this.users=users; this.tracking=tracking; this.db=db;
    }
    public record Presence(String status, Instant lastSeenAt, Instant serverNow) {}
    public record Profile(Long id, String username, String presentationName, String bio,
                          java.time.LocalDate registrationDate, Map<String,Object> statistics, Presence presence) {}
    public User authorized(long id) {
        long viewer=current.getCurrentUserId();
        if (viewer!=id && tracking.findLinkBetweenUsers(viewer,id).filter(t->t.getStatus()==TrackingStatus.ACCEPTED).isEmpty()) throw unavailable();
        return users.findById(id).filter(u->Boolean.TRUE.equals(u.getActive())).orElseThrow(this::unavailable);
    }
    private ResponseStatusException unavailable() { return new ResponseStatusException(HttpStatus.NOT_FOUND,"Profile unavailable"); }
    private SocialPrivacy privacy(long id) {
        return db.query("select * from social_preferences where user_id=?", (r,n)->new SocialPrivacy(r.getBoolean("show_presence"),r.getBoolean("show_last_seen"),r.getBoolean("share_verified_minutes"),r.getBoolean("share_verified_sessions")),id)
                .stream().findFirst().orElse(SocialPrivacy.hidden());
    }
    @Transactional(readOnly=true) public SocialPrivacy ownPrivacy() { return privacy(current.getCurrentUserId()); }
    @Transactional public SocialPrivacy updatePrivacy(SocialPrivacy value) {
        long id=current.getCurrentUserId(); lock(id);
        db.update("update social_preferences set show_presence=?,show_last_seen=?,share_verified_minutes=?,share_verified_sessions=? where user_id=?",
                value.showPresence(),value.showLastSeen(),value.shareVerifiedMinutes(),value.shareVerifiedSessions(),id);
        if (!value.showPresence() && !value.showLastSeen()) {
            db.update("delete from presence_session where user_id=?",id);
            db.update("update social_preferences set last_active_at=null where user_id=?",id);
        }
        return value;
    }
    private void lock(long id) {
        db.update("insert into social_preferences(user_id) values(?) on conflict do nothing",id);
        db.queryForObject("select user_id from social_preferences where user_id=? for update",Long.class,id);
    }
    @Transactional(readOnly=true) public Profile profile(long id) {
        User u=authorized(id); SocialPrivacy p=privacy(id);
        Map<String,Object> statistics=new LinkedHashMap<>();
        if (p.shareVerifiedMinutes() || p.shareVerifiedSessions()) {
            var totals=db.queryForMap("select coalesce(sum(confirmed_seconds),0)/60.0 as minutes,count(*) as sessions from study_ledger where user_id=? and state='COMPLETE' and verified=true and source in ('INDIVIDUAL','GROUP')",id);
            if(p.shareVerifiedMinutes()) statistics.put("verifiedMinutes",totals.get("minutes"));
            if(p.shareVerifiedSessions()) statistics.put("verifiedSessions",totals.get("sessions"));
        }
        return new Profile(u.getId(),u.getUsername(),u.getDisplayName()==null?u.getUsername():u.getDisplayName(),u.getBio(),u.getRegistrationDate(),statistics,presenceFor(id,p));
    }
    @Transactional(readOnly=true) public Presence presence(long id) { authorized(id); return presenceFor(id,privacy(id)); }
    private Presence presenceFor(long id, SocialPrivacy p) {
        Instant now=db.queryForObject("select clock_timestamp()",java.sql.Timestamp.class).toInstant();
        String status="HIDDEN"; Instant last=null;
        if (p.showPresence()) {
            boolean online=Boolean.TRUE.equals(db.queryForObject("select exists(select 1 from presence_session where user_id=? and last_seen_at > ?::timestamptz - interval '90 seconds')",Boolean.class,id,now.toString()));
            status=online?"ONLINE":"OFFLINE";
        }
        if (p.showLastSeen()) {
            var timestamp=db.queryForObject("select last_active_at from social_preferences where user_id=?",java.sql.Timestamp.class,id);
            last=timestamp==null?null:timestamp.toInstant();
        }
        return new Presence(status,last,now);
    }
    @Transactional public Presence heartbeat(UUID session) {
        long id=current.getCurrentUserId(); lock(id); SocialPrivacy p=privacy(id);
        if (p.showPresence() || p.showLastSeen()) {
            db.update("delete from presence_session where user_id=? and last_seen_at < clock_timestamp()-interval '90 seconds'",id);
            // Bound abandoned-session retention and work per heartbeat; no account history is kept.
            db.update("delete from presence_session where ctid in (select ctid from presence_session where last_seen_at < clock_timestamp()-interval '1 day' limit 200)");
            boolean exists=Boolean.TRUE.equals(db.queryForObject("select exists(select 1 from presence_session where user_id=? and session_id=?)",Boolean.class,id,session));
            if(!exists && db.queryForObject("select count(*) from presence_session where user_id=?",Long.class,id)>=32)
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Too many presence sessions");
            var updated=db.query("""
                insert into presence_session(user_id,session_id,last_seen_at) values(?,?,clock_timestamp())
                on conflict(user_id,session_id) do update set last_seen_at=excluded.last_seen_at
                where presence_session.last_seen_at < clock_timestamp()-interval '25 seconds'
                returning last_seen_at
                """,(r,n)->r.getTimestamp(1),id,session);
            if(!updated.isEmpty()) db.update("update social_preferences set last_active_at=greatest(last_active_at,?) where user_id=?",updated.getFirst(),id);
        }
        return presenceFor(id,p);
    }
}
