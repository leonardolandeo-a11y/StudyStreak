package com.example.studystreak.service;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.*;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;

@Service
@DependsOn("studyLedgerSchemaReady")
public class StudyAnalyticsService {
    private final JdbcTemplate db;
    private final CurrentUserService current;
    public StudyAnalyticsService(JdbcTemplate db,CurrentUserService current) { this.db=db;this.current=current; }
    private double number(Map<String,Object> row,String key) { return ((Number)row.get(key)).doubleValue(); }
    private Timestamp boundary(LocalDate date,ZoneId zone) { return Timestamp.from(date.atStartOfDay(zone).toInstant()); }
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Map<String,Object> stats(int days) {
        if(days!=7 && days!=30) throw new IllegalArgumentException("Choose 7 or 30 days");
        var user=current.getCurrentUser(); long id=user.getId(); ZoneId zone=StudyDatePolicy.zone(user);
        LocalDate today=db.queryForObject("select (clock_timestamp() at time zone ?)::date",LocalDate.class,zone.getId());
        LocalDate first=today.minusDays(days-1), end=today.plusDays(1);
        var start=boundary(first,zone); var until=boundary(end,zone); var previous=boundary(first.minusDays(days),zone);
        Map<String,Object> result=new LinkedHashMap<>(); result.put("days",days);result.put("timeZone",zone.getId());
        var totals=db.queryForMap("select coalesce(sum(confirmed_seconds)/60.0,0) as minutes,count(*) as sessions,coalesce(sum(confirmed_seconds) filter(where verified)/60.0,0) as verified,coalesce(sum(confirmed_seconds) filter(where not verified)/60.0,0) as estimated from study_ledger where user_id=? and state='COMPLETE'",id);
        result.put("totalMinutes",totals.get("minutes")); result.put("completedSessions",totals.get("sessions"));
        result.put("verifiedMinutes",totals.get("verified"));result.put("estimatedMinutes",totals.get("estimated"));
        var period=db.queryForMap("select coalesce(sum(confirmed_seconds)/60.0,0) as minutes,count(*) as sessions,coalesce(sum(confirmed_seconds) filter(where source='GROUP')/60.0,0) as grouped,count(*) filter(where source='GROUP') as groups from study_ledger where user_id=? and state='COMPLETE' and completed_at>=? and completed_at<?",id,start,until);
        result.put("periodMinutes",period.get("minutes"));result.put("periodSessions",period.get("sessions"));
        result.put("groupMinutes",period.get("grouped")); result.put("individualMinutes",number(period,"minutes")-number(period,"grouped")); result.put("groupSessions",period.get("groups"));
        var prior=db.queryForObject("select coalesce(sum(confirmed_seconds)/60.0,0) from study_ledger where user_id=? and state='COMPLETE' and completed_at>=? and completed_at<?",Double.class,id,previous,start);
        result.put("previousMinutes",prior);result.put("changePercent",prior==0 ? null : (number(period,"minutes")-prior)*100/prior);
        var cohort=db.queryForMap("select count(*) as attempts,count(*) filter(where state='COMPLETE') as done from study_ledger where user_id=? and verified and started_at>=? and started_at<?",id,start,until);
        result.put("completionPercent",number(cohort,"attempts")==0 ? null : number(cohort,"done")*100/number(cohort,"attempts"));
        result.put("averageMinutes",number(period,"sessions")==0 ? 0 : number(period,"minutes")/number(period,"sessions"));
        var daily=daily(id,zone,first,end);result.put("daily",daily);
        result.put("bestDayMinutes",daily.stream().mapToDouble(row->number(row,"minutes")).max().orElse(0));
        result.put("activeDays",daily.stream().filter(row->number(row,"minutes")>0).count());
        result.put("activity",daily(id,zone,today.minusDays(364),end));
        result.put("byGoal",db.queryForList("select goal_id as \"goalId\",goal_name as topic,sum(confirmed_seconds)/60.0 as minutes,count(*) as sessions from study_ledger where user_id=? and state='COMPLETE' group by goal_id,goal_name order by minutes desc",id));
        result.put("hourly",db.queryForList("select h as hour,coalesce(sum(l.confirmed_seconds)/3600.0,0) as hours from generate_series(0,23) h left join study_ledger l on l.user_id=? and l.state='COMPLETE' and l.completed_at>=? and l.completed_at<? and extract(hour from l.completed_at at time zone ?)=h group by h order by h",id,start,until,zone.getId()));
        result.put("weekly",buckets(id,zone,"week",start,until));result.put("monthly",buckets(id,zone,"month",start,until));
        var weekStart=boundary(today.with(java.time.DayOfWeek.MONDAY),zone);
        result.put("weekMinutes",db.queryForObject("select coalesce(sum(confirmed_seconds)/60.0,0) from study_ledger where user_id=? and state='COMPLETE' and completed_at>=? and completed_at<?",Double.class,id,weekStart,until));
        String dates="select distinct (completed_at at time zone ?)::date as day from study_ledger where user_id=? and state='COMPLETE' and confirmed_seconds>0";
        var streak=db.queryForMap("with days as ("+dates+"), islands as (select day,day-(row_number() over(order by day))::int as island from days), spans as (select count(*) as length,max(day) as last from islands group by island) select coalesce(max(length),0) as best,coalesce(max(length) filter(where last>=?::date-1),0) as current from spans",zone.getId(),id,today.toString());
        result.put("studyStreak",streak.get("current"));result.put("bestStudyStreak",streak.get("best"));
        return result;
    }
    private List<Map<String,Object>> daily(long user,ZoneId zone,LocalDate first,LocalDate end) {
        return db.queryForList("select d::date::text as date,coalesce(sum(l.confirmed_seconds)/60.0,0) as minutes,count(l.id) as sessions from generate_series(?::date,?::date-1,interval '1 day') d left join study_ledger l on l.user_id=? and l.state='COMPLETE' and l.completed_at>=? and l.completed_at<? and (l.completed_at at time zone ?)::date=d::date group by d order by d",first.toString(),end.toString(),user,boundary(first,zone),boundary(end,zone),zone.getId());
    }
    private List<Map<String,Object>> buckets(long user,ZoneId zone,String unit,Timestamp start,Timestamp end) {
        return db.queryForList("select date_trunc(?,completed_at at time zone ?)::date::text as date,sum(confirmed_seconds)/3600.0 as hours from study_ledger where user_id=? and state='COMPLETE' and completed_at>=? and completed_at<? group by 1 order by 1",unit,zone.getId(),user,start,end);
    }
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Map<String,Object> history(LocalDate from,LocalDate to,int page) {
        if(from==null || to==null || to.isBefore(from) || to.isAfter(from.plusDays(366)) || page<0 || page>10000) throw new IllegalArgumentException("History requires a valid period up to 366 days and page 0–10000");
        var user=current.getCurrentUser(); ZoneId zone=StudyDatePolicy.zone(user);
        var start=boundary(from,zone);var end=boundary(to.plusDays(1),zone);
        var content=db.queryForList("select id,goal_id,goal_name,source,state,planned_seconds,confirmed_seconds,started_at,completed_at,verified from study_ledger where user_id=? and started_at>=? and started_at<? order by started_at desc,id desc limit 25 offset ?",user.getId(),start,end,page*25);
        Long total=db.queryForObject("select count(*) from study_ledger where user_id=? and started_at>=? and started_at<?",Long.class,user.getId(),start,end);
        return Map.of("content",content,"page",page,"totalElements",total,"totalPages",(total+24)/25);
    }
}
