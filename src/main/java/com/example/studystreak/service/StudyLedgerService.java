package com.example.studystreak.service;

import com.example.studystreak.model.StudyRoom;
import com.example.studystreak.exceptions.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.DependsOn;
import org.springframework.transaction.annotation.Transactional;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;

@Service
@DependsOn("studyLedgerSchemaReady")
public class StudyLedgerService {
    private final JdbcTemplate db;
    private final CurrentUserService current;
    public StudyLedgerService(JdbcTemplate db, CurrentUserService current) { this.db=db; this.current=current; }
    private Instant now() { return db.queryForObject("select clock_timestamp()", Timestamp.class).toInstant(); }
    private void lockUser(long user) { db.queryForObject("select id from users where id=? for update", Long.class,user); }
    private List<Map<String,Object>> rows(String sql,Object... args) { return db.queryForList(sql,args); }
    private Instant instant(Map<String,Object> row,String key) {
        Object value=row.get(key); return value==null ? null : ((Timestamp)value).toInstant();
    }
    private long number(Map<String,Object> row,String key) { return ((Number)row.get(key)).longValue(); }
    private String goal(long user,Long goal) {
        var found=rows("select topic from goal where id=? and user_id=? and completed=false",goal,user);
        if(found.isEmpty()) throw new ForbiddenException("Choose one of your active Goals");
        return (String)found.getFirst().get("topic");
    }
    private Map<String,Object> owned(UUID id,long user) {
        var result=rows("select * from study_ledger where id=? and user_id=? for update",id,user);
        if(result.isEmpty()) throw new ResourceNotFoundException("No server-started session for this account");
        return result.getFirst();
    }
    private void freeSlot(long user,Instant time) {
        db.update("update study_ledger set state='CANCELLED',completed_at=? where user_id=? and source='INDIVIDUAL' and state in ('RUNNING','PAUSED') and last_seen_at < ?",
            Timestamp.from(time),user,Timestamp.from(time.minusSeconds(35)));
        if(!rows("select id from study_ledger where user_id=? and state in ('RUNNING','PAUSED')",user).isEmpty())
            throw new ConflictException("This account already has an active study session on another device");
    }
    @Transactional
    public Map<String,Object> start(UUID id,Long goalId,int minutes) {
        if(id==null || minutes<5 || minutes>120) throw new IllegalArgumentException("Duration must be 5–120 minutes");
        long user=current.getCurrentUserId(); lockUser(user);
        var existing=rows("select * from study_ledger where id=?",id);
        if(!existing.isEmpty()) {
            var row=existing.getFirst();
            if(number(row,"user_id")!=user || !Objects.equals(row.get("original_goal_id"),goalId) || number(row,"planned_seconds")!=minutes*60L || !"INDIVIDUAL".equals(row.get("source")))
                throw new ConflictException("Session UUID already belongs to another attempt");
            return row;
        }
        String title=goal(user,goalId); Instant time=now(); freeSlot(user,time);
        int inserted=db.update("insert into study_ledger(id,user_id,goal_id,original_goal_id,goal_name,source,state,planned_seconds,started_at,last_seen_at,ends_at) values (?,?,?,?,?,'INDIVIDUAL','RUNNING',?,?,?,?) on conflict(id) do nothing",
            id,user,goalId,goalId,title,minutes*60,Timestamp.from(time),Timestamp.from(time),Timestamp.from(time.plusSeconds(minutes*60L)));
        if(inserted==0) throw new ConflictException("Session UUID already belongs to another attempt");
        return owned(id,user);
    }
    // Credit consecutive observations only. A disconnected gap >35s adds nothing.
    private long observe(Map<String,Object> row,Instant time) {
        long observed=number(row,"observed_ms");
        Instant last=instant(row,"last_seen_at"), deadline=instant(row,"ends_at");
        Instant until=deadline!=null && deadline.isBefore(time) ? deadline : time;
        long gap=Duration.between(last,time).toMillis();
        if("RUNNING".equals(row.get("state")) && gap>=0 && gap<=35000)
            observed+=Math.max(0,Duration.between(last,until).toMillis());
        observed=Math.min(number(row,"planned_seconds")*1000,observed);
        db.update("update study_ledger set observed_ms=?,last_seen_at=? where id=?",observed,Timestamp.from(time),row.get("id"));
        return observed;
    }
    @Transactional
    public Map<String,Object> pulse(UUID id,String action) {
        if(!Set.of("PULSE","PAUSE","RESUME","COMPLETE","CANCEL").contains(action)) throw new IllegalArgumentException("Invalid study action");
        long user=current.getCurrentUserId(); lockUser(user); var row=owned(id,user);
        if(!"INDIVIDUAL".equals(row.get("source"))) throw new ConflictException("Group sessions are controlled by the server");
        if(Set.of("COMPLETE","CANCELLED").contains(row.get("state"))) return row;
        Instant time=now();
        if("COMPLETE".equals(action) && (instant(row,"ends_at")==null || time.isBefore(instant(row,"ends_at")) || !"RUNNING".equals(row.get("state"))))
            throw new ConflictException("The server timer has not completed");
        long observed=observe(row,time);
        switch(action) {
            case "PAUSE" -> {
                if("RUNNING".equals(row.get("state"))) db.update("update study_ledger set state='PAUSED',ends_at=null where id=?",id);
            }
            case "RESUME" -> {
                if("PAUSED".equals(row.get("state"))) db.update("update study_ledger set state='RUNNING',ends_at=? where id=?",
                    Timestamp.from(time.plusMillis(number(row,"planned_seconds")*1000-observed)),id);
            }
            case "COMPLETE" -> finish(row,time,observed);
            case "CANCEL" -> db.update("update study_ledger set state='CANCELLED',completed_at=? where id=?",Timestamp.from(time),id);
            default -> { }
        }
        return owned(id,user);
    }
    private void finish(Map<String,Object> row,Instant time,long observed) {
        int seconds=(int)(observed/60000)*60;
        db.update("update study_ledger set state=?,confirmed_seconds=?,completed_at=? where id=?",
            seconds>=60 ? "COMPLETE":"CANCELLED",seconds,Timestamp.from(time),row.get("id"));
    }
    @Transactional(readOnly=true)
    public Map<String,Object> selection(UUID room) {
        long user=current.getCurrentUserId(); membership(room,user);
        var selected=rows("select goal_id from study_room_selection where room_id=? and user_id=?",room,user);
        Map<String,Object> response=new HashMap<>();
        response.put("goalId",selected.isEmpty()?null:selected.getFirst().get("goal_id"));
        response.put("sessions",rows("select l.id,l.state,l.confirmed_seconds,l.observed_ms,l.planned_seconds from study_ledger l join study_run r on r.id=l.run_id where r.room_id=? and l.user_id=? order by l.started_at desc limit 1",room,user));
        return response;
    }
    private void membership(UUID room,long user) {
        if(rows("select id from study_room_member where room_id=? and user_id=?",room,user).isEmpty()) throw new ForbiddenException("Room membership required");
    }
    @Transactional
    public Map<String,Object> select(UUID room,Long goalId) {
        if (rows("select id from study_room where id=? for update",room).isEmpty()) throw new ResourceNotFoundException("Study room not found");
        long user=current.getCurrentUserId(); membership(room,user); lockUser(user);
        if(goalId!=null) goal(user,goalId);
        if(!rows("select l.id from study_ledger l join study_run r on r.id=l.run_id where l.user_id=? and r.room_id=? and r.state in ('RUNNING','PAUSED')",user,room).isEmpty())
            throw new ConflictException("Goal selection is locked for this round");
        db.update("insert into study_room_selection(room_id,user_id,goal_id) values (?,?,?) on conflict(room_id,user_id) do update set goal_id=excluded.goal_id",room,user,goalId);
        return selection(room);
    }
    // Called with the room row locked; lock order is room -> users -> ledger.
    public void roomTransition(StudyRoom room) {
        Instant time=now();
        var runs=rows("select * from study_run where room_id=? and state in ('RUNNING','PAUSED') for update",room.getId());
        if(!runs.isEmpty()) {
            var run=runs.getFirst();
            if("RUNNING".equals(run.get("state")) && instant(run,"ends_at")!=null && !time.isBefore(instant(run,"ends_at"))) {
                finishRun(run,instant(run,"ends_at")); runs=List.of();
            }
        }
        if(!"FOCUS".equals(room.getPhase()) || "COMPLETE".equals(room.getTimerStatus())) { cancelRuns(room.getId()); return; }
        if("RUNNING".equals(room.getTimerStatus())) {
            if(runs.isEmpty()) db.update("insert into study_run(id,room_id,state,started_at,ends_at) values (?,?,'RUNNING',?,?)",UUID.randomUUID(),room.getId(),Timestamp.from(time),Timestamp.from(room.getEndsAt()));
            else if("PAUSED".equals(runs.getFirst().get("state"))) {
                UUID id=(UUID)runs.getFirst().get("id");
                db.update("update study_run set state='RUNNING',ends_at=? where id=?",Timestamp.from(room.getEndsAt()),id);
                db.update("update study_ledger set ends_at=?,last_seen_at=? where run_id=? and state in ('RUNNING','PAUSED')",Timestamp.from(room.getEndsAt()),Timestamp.from(time),id);
            }
        } else if(!runs.isEmpty()) {
            UUID id=(UUID)runs.getFirst().get("id");
            for(var row:rows("select * from study_ledger where run_id=? and state='RUNNING' order by user_id for update",id)) {
                observe(row,time); db.update("update study_ledger set state='PAUSED',ends_at=null where id=?",row.get("id"));
            }
            db.update("update study_run set state='PAUSED',ends_at=null where id=?",id);
        }
    }
    public void cancelRuns(UUID room) {
        db.update("update study_ledger set state='CANCELLED',completed_at=clock_timestamp() where run_id in (select id from study_run where room_id=? and state in ('RUNNING','PAUSED')) and state in ('RUNNING','PAUSED')",room);
        db.update("update study_run set state='CANCELLED',completed_at=clock_timestamp() where room_id=? and state in ('RUNNING','PAUSED')",room);
    }
    public void leave(UUID room,long user) {
        db.update("update study_ledger set state='CANCELLED',completed_at=clock_timestamp() where user_id=? and run_id in (select id from study_run where room_id=?) and state in ('RUNNING','PAUSED')",user,room);
        db.update("delete from study_room_selection where room_id=? and user_id=?",room,user);
    }
    public void heartbeat(StudyRoom room,long user,boolean studying) {
        var runs=rows("select * from study_run where room_id=? and state='RUNNING'",room.getId());
        if(runs.isEmpty()) return;
        var run=runs.getFirst(); Instant time=now();
        if(!time.isBefore(instant(run,"ends_at"))) { finishRun(run,instant(run,"ends_at")); return; }
        lockUser(user);
        var attempts=rows("select * from study_ledger where run_id=? and user_id=? for update",run.get("id"),user);
        if(attempts.isEmpty()) {
            if(!studying) return;
            var selected=rows("select g.id,g.topic from study_room_selection s join goal g on g.id=s.goal_id where s.room_id=? and s.user_id=? and g.user_id=? and g.completed=false",room.getId(),user,user);
            if(selected.isEmpty()) return;
            // Presence is still valid if another session owns the account's recording slot.
            if(!rows("select id from study_ledger where user_id=? and state in ('RUNNING','PAUSED')",user).isEmpty()) return;
            var g=selected.getFirst();
            db.update("insert into study_ledger(id,user_id,goal_id,original_goal_id,goal_name,run_id,source,state,planned_seconds,started_at,last_seen_at,ends_at) values (?,?,?,?,?,?,'GROUP','RUNNING',1500,?,?,?)",
                UUID.randomUUID(),user,g.get("id"),g.get("id"),g.get("topic"),run.get("id"),Timestamp.from(time),Timestamp.from(time),run.get("ends_at"));
        } else {
            var row=attempts.getFirst();
            if(Set.of("COMPLETE","CANCELLED").contains(row.get("state"))) return;
            observe(row,time);
            db.update("update study_ledger set state=? where id=?",studying ? "RUNNING":"PAUSED",row.get("id"));
        }
    }
    private void finishRun(Map<String,Object> run,Instant deadline) {
        for(var row:rows("select * from study_ledger where run_id=? and state in ('RUNNING','PAUSED') order by user_id for update",run.get("id")))
            finish(row,deadline,observe(row,deadline));
        db.update("update study_run set state='COMPLETE',completed_at=? where id=?",Timestamp.from(deadline),run.get("id"));
    }
    @Transactional
    public void expire() {
        // Same room lock as commands; SKIP LOCKED lets another replica finish busy rooms.
        for(var room:rows("select r.id from study_room r join study_run s on s.room_id=r.id where s.state='RUNNING' and s.ends_at<=clock_timestamp() for update of r skip locked")) {
            for(var run:rows("select * from study_run where room_id=? and state='RUNNING' and ends_at<=clock_timestamp() for update",room.get("id"))) finishRun(run,instant(run,"ends_at"));
        }
        db.update("update study_ledger set state='CANCELLED',completed_at=clock_timestamp() where source='INDIVIDUAL' and state in ('RUNNING','PAUSED') and last_seen_at<clock_timestamp()-interval '7 days'");
    }
    @Transactional(readOnly=true)
    public Map<String,Object> active() {
        Map<String,Object> result=new HashMap<>();
        result.put("serverNow",now());
        var sessions=rows("select * from study_ledger where user_id=? and source='INDIVIDUAL' and state in ('RUNNING','PAUSED')",current.getCurrentUserId());
        result.put("session",sessions.isEmpty()?null:sessions.getFirst()); return result;
    }
    @Transactional
    public Map<String,Object> complete(Long goalId,UUID id,int minutes) {
        long user=current.getCurrentUserId(); lockUser(user); var row=owned(id,user);
        if(!Objects.equals(row.get("original_goal_id"),goalId) || number(row,"planned_seconds")!=minutes*60L)
            throw new ConflictException("Completion does not match its server-started Goal and duration");
        return pulse(id,"COMPLETE");
    }

    @Transactional(readOnly=true)
    public Map<String,Object> summary(Long goalId) {
        long user=current.getCurrentUserId();
        if(rows("select id from goal where id=? and user_id=?",goalId,user).isEmpty()) throw new ForbiddenException("Goal ownership required");
        var totals=db.queryForMap("select coalesce(sum(confirmed_seconds)/60,0) as minutes,count(*) as sessions from study_ledger where user_id=? and goal_id=? and state='COMPLETE'",user,goalId);
        return Map.of("goalId",goalId,"totalMinutes",totals.get("minutes"),"completedSessions",totals.get("sessions"));
    }
}
