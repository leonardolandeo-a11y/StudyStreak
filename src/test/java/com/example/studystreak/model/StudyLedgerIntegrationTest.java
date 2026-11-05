package com.example.studystreak.model;

import com.example.studystreak.repository.*;
import com.example.studystreak.service.*;
import com.example.studystreak.dto.Room.*;
import com.example.studystreak.exceptions.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.core.io.ClassPathResource;
import javax.sql.DataSource;
import java.time.*;
import java.sql.Timestamp;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class StudyLedgerIntegrationTest {
 @Autowired StudyLedgerService ledger;
 @Autowired StudyAnalyticsService analytics;
 @Autowired StudyRoomService rooms;
 @Autowired StudyRoomExpiry expiry;
 @Autowired UserRepository users;
 @Autowired GoalRepository goals;
 @Autowired JdbcTemplate db;
 @Autowired DataSource source;
 private User user;
 private Goal goal;
 private UUID roomId;
 @BeforeEach void setup() {
  user=new User();String name="ledger_"+UUID.randomUUID();user.setUsername(name);user.setEmail(name+"@test.invalid");user.setPassword("test");user.setRole(Role.USER);user.setTimeZone("America/Lima");user=users.saveAndFlush(user);
  goal=new Goal();goal.setUser(user);goal.setTopic("Private goal");goal.setFrequency(3);goal.setDuration(30);goal.setCompleted(false);goal=goals.saveAndFlush(goal);login();
 }
 private void login(){SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user.getUsername(),null,List.of()));}
 @AfterEach void cleanup(){
  if(roomId!=null){db.update("delete from study_room_member where room_id=?",roomId);db.update("delete from study_room where id=?",roomId);}
  db.update("delete from study_ledger where user_id=?",user.getId());
  db.update("delete from focus_session where goal_id=?",goal.getId());
  if(goals.existsById(goal.getId()))goals.deleteById(goal.getId());
  users.deleteById(user.getId());SecurityContextHolder.clearContext();
 }
 @Test void zeroNegativeAndFrontendOnlyCompletionsAreRejected(){
  assertThrows(IllegalArgumentException.class,()->ledger.start(UUID.randomUUID(),goal.getId(),0));
  assertThrows(IllegalArgumentException.class,()->ledger.start(UUID.randomUUID(),goal.getId(),-5));
  assertThrows(ResourceNotFoundException.class,()->ledger.complete(goal.getId(),UUID.randomUUID(),25));
  UUID id=UUID.randomUUID();ledger.start(id,goal.getId(),5);
  assertThrows(ConflictException.class,()->ledger.complete(goal.getId(),id,5));
  assertEquals(0L,((Number)ledger.summary(goal.getId()).get("totalMinutes")).longValue());
 }
 @Test void concurrentUuidStartsAndCompletionRetriesAreIdempotent() throws Exception {
  UUID id=UUID.randomUUID();
  try(var pool=Executors.newFixedThreadPool(2)){
   CountDownLatch start=new CountDownLatch(1);
   Callable<Map<String,Object>> begin=()->{login();try{start.await();return ledger.start(id,goal.getId(),5);}finally{SecurityContextHolder.clearContext();}};
   var a=pool.submit(begin);var b=pool.submit(begin);start.countDown();assertEquals(a.get(10,TimeUnit.SECONDS).get("id"),b.get(10,TimeUnit.SECONDS).get("id"));
   db.update("update study_ledger set observed_ms=299000,last_seen_at=clock_timestamp()-interval '2 seconds',ends_at=clock_timestamp()-interval '1 second' where id=?",id);
   Callable<Map<String,Object>> finish=()->{login();try{return ledger.complete(goal.getId(),id,5);}finally{SecurityContextHolder.clearContext();}};
   var x=pool.submit(finish);var y=pool.submit(finish);assertEquals(x.get(10,TimeUnit.SECONDS),y.get(10,TimeUnit.SECONDS));
  }
  assertEquals(1L,((Number)ledger.summary(goal.getId()).get("completedSessions")).longValue());
  assertEquals(5L,((Number)ledger.summary(goal.getId()).get("totalMinutes")).longValue());
 }
 @Test void oneAccountCannotAccrueTwoParallelSessionsAndDisconnectedGapsAreExcluded(){
  UUID id=UUID.randomUUID();ledger.start(id,goal.getId(),5);
  assertThrows(ConflictException.class,()->ledger.start(UUID.randomUUID(),goal.getId(),5));
  db.update("update study_ledger set last_seen_at=clock_timestamp()-interval '50 seconds' where id=?",id);
  assertEquals(0L,((Number)ledger.pulse(id,"PULSE").get("observed_ms")).longValue());
  db.update("update study_ledger set last_seen_at=clock_timestamp()-interval '10 seconds' where id=?",id);
  long before=((Number)ledger.pulse(id,"PAUSE").get("observed_ms")).longValue();assertTrue(before>=10000&&before<11000);
  db.update("update study_ledger set last_seen_at=clock_timestamp()-interval '10 seconds' where id=?",id);
  assertEquals(before,((Number)ledger.pulse(id,"PULSE").get("observed_ms")).longValue());
  ledger.pulse(id,"RESUME");assertEquals("RUNNING",((Map<?,?>)ledger.active().get("session")).get("state"));
 }
 @Test void groupRequiresPrivateOptInAndActualParticipationAndCompletesWithoutClient(){
  var room=rooms.create(new StudyRoomRequest("Ledger room"));roomId=room.id();
  ledger.select(roomId,goal.getId());
  rooms.timer(roomId,new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.START));
  rooms.heartbeat(roomId,new StudyRoomHeartbeat(false));
  assertEquals(0,db.queryForObject("select count(*) from study_ledger where user_id=?",Integer.class,user.getId()));
  rooms.heartbeat(roomId,new StudyRoomHeartbeat(true));
  var row=db.queryForMap("select * from study_ledger where user_id=?",user.getId());UUID id=(UUID)row.get("id");
  rooms.heartbeat(roomId,new StudyRoomHeartbeat(null));
  assertEquals(1,db.queryForObject("select count(*) from study_ledger where user_id=?",Integer.class,user.getId()));
  assertThrows(ConflictException.class,()->ledger.select(roomId,null));
  db.update("update study_ledger set observed_ms=119000,last_seen_at=clock_timestamp()-interval '2 seconds',ends_at=clock_timestamp()-interval '1 second' where id=?",id);
  db.update("update study_run set ends_at=clock_timestamp()-interval '1 second' where id=?",row.get("run_id"));
  expiry.completeExpired();expiry.completeExpired();
  assertEquals(2L,((Number)ledger.summary(goal.getId()).get("totalMinutes")).longValue());
  assertEquals(1L,((Number)analytics.stats(7).get("groupSessions")).longValue());
 }
 @Test void leavingOrResettingCancelsGroupParticipation(){
  var room=rooms.create(new StudyRoomRequest("Cancelled room"));roomId=room.id();ledger.select(roomId,goal.getId());rooms.timer(roomId,new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.START));rooms.heartbeat(roomId,new StudyRoomHeartbeat(true));
  rooms.timer(roomId,new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.RESET));
  assertEquals("CANCELLED",db.queryForObject("select state from study_ledger where user_id=?",String.class,user.getId()));
  assertEquals(0L,((Number)ledger.summary(goal.getId()).get("totalMinutes")).longValue());
 }
 private UUID historical(Instant time){
  UUID id=UUID.randomUUID();db.update("insert into study_ledger(id,user_id,goal_id,goal_name,source,state,planned_seconds,confirmed_seconds,started_at,last_seen_at,completed_at,verified) values (?,?,?,'Private goal','LEGACY','COMPLETE',300,300,?,?,?,false)",id,user.getId(),goal.getId(),Timestamp.from(time),Timestamp.from(time),Timestamp.from(time));return id;
 }
 @Test void midnightAggregatesAndGoalDeletionPreserveHistoricalTotals(){
  LocalDate today=LocalDate.now(ZoneId.of("America/Lima"));Instant midnight=today.atStartOfDay(ZoneId.of("America/Lima")).toInstant();historical(midnight.minusSeconds(1));historical(midnight.plusSeconds(1));
  var stats=analytics.stats(7);assertEquals(10d,((Number)stats.get("totalMinutes")).doubleValue());assertEquals(0d,((Number)stats.get("verifiedMinutes")).doubleValue());assertEquals(2L,stats.get("activeDays"));
  var daily=(List<?>)stats.get("daily");assertEquals(5d,((Number)((Map<?,?>)daily.getLast()).get("minutes")).doubleValue());
  goals.deleteById(goal.getId());assertEquals(10d,((Number)analytics.stats(7).get("totalMinutes")).doubleValue());
  assertEquals(2L,analytics.history(today.minusDays(1),today,0).get("totalElements"));
 }
 @Test void migrationCanRunAgainAndPersistedStateRecovers(){
  UUID id=UUID.randomUUID();ledger.start(id,goal.getId(),5);
  new ResourceDatabasePopulator(new ClassPathResource("db/study-tracking-v3.sql")).execute(source);
  assertEquals(id,((Map<?,?>)ledger.active().get("session")).get("id"));
  assertEquals(1,db.queryForObject("select count(*) from study_ledger where id=?",Integer.class,id));
 }
 @Test void otherUserCannotReadOrModifySessionOrPrivateSelection(){
  UUID id=UUID.randomUUID();ledger.start(id,goal.getId(),5);
  var room=rooms.create(new StudyRoomRequest("Private room"));roomId=room.id();
  User stranger=new User();String name="stranger_"+UUID.randomUUID();stranger.setUsername(name);stranger.setEmail(name+"@invalid.test");stranger.setPassword("test");stranger.setRole(Role.USER);stranger=users.saveAndFlush(stranger);
  try{
   SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(name,null,List.of()));
   assertThrows(ResourceNotFoundException.class,()->ledger.pulse(id,"PULSE"));assertThrows(ForbiddenException.class,()->ledger.selection(roomId));assertThrows(ForbiddenException.class,()->ledger.start(UUID.randomUUID(),goal.getId(),5));
  }finally{users.deleteById(stranger.getId());login();}
 }
 @Test void retryAfterGoalDeletionAcknowledgesAlreadyConfirmedSession(){
  UUID id=UUID.randomUUID();ledger.start(id,goal.getId(),5);
  db.update("update study_ledger set observed_ms=299000,last_seen_at=clock_timestamp()-interval '2 seconds',ends_at=clock_timestamp()-interval '1 second' where id=?",id);
  ledger.complete(goal.getId(),id,5);goals.deleteById(goal.getId());
  assertEquals("COMPLETE",ledger.complete(goal.getId(),id,5).get("state"));
  assertEquals(5d,((Number)analytics.stats(7).get("totalMinutes")).doubleValue());
 }
 @Test void emptyAndIncompleteMetricsAreDistinctAndPeriodComparisonIsConsistent(){
  var empty=analytics.stats(30);assertEquals(0d,((Number)empty.get("totalMinutes")).doubleValue());assertNull(empty.get("completionPercent"));assertEquals(30,((List<?>)empty.get("daily")).size());
  assertThrows(IllegalArgumentException.class,()->analytics.stats(8));
  UUID completed=UUID.randomUUID();ledger.start(completed,goal.getId(),5);
  db.update("update study_ledger set observed_ms=299000,last_seen_at=clock_timestamp()-interval '2 seconds',ends_at=clock_timestamp()-interval '1 second' where id=?",completed);
  ledger.complete(goal.getId(),completed,5);
  UUID cancelled=UUID.randomUUID();ledger.start(cancelled,goal.getId(),5);ledger.pulse(cancelled,"CANCEL");
  historical(LocalDate.now(ZoneId.of("America/Lima")).minusDays(7).atStartOfDay(ZoneId.of("America/Lima")).toInstant());
  var stats=analytics.stats(7);
  assertEquals(50d,stats.get("completionPercent"));assertEquals(5d,stats.get("averageMinutes"));assertEquals(5d,stats.get("previousMinutes"));assertEquals(0d,stats.get("changePercent"));assertEquals(1L,stats.get("studyStreak"));
  assertEquals(5d,((Number)stats.get("verifiedMinutes")).doubleValue());assertEquals(5d,((Number)stats.get("estimatedMinutes")).doubleValue());
  assertThrows(org.springframework.dao.DataIntegrityViolationException.class,()->db.update("update study_ledger set observed_ms=-1 where id=?",completed));
 }
 @Test void historicalMigrationPreservesUuidAndTimestampExactly(){
  UUID id=UUID.randomUUID();Instant time=Instant.parse("2025-01-01T04:59:59Z");
  db.update("insert into focus_session(id,goal_id,duration_minutes,completed_at) values (?,?,25,?)",id,goal.getId(),Timestamp.from(time));
  var migration=new ResourceDatabasePopulator(new ClassPathResource("db/study-tracking-v3.sql"));migration.execute(source);migration.execute(source);
  var row=db.queryForMap("select * from study_ledger where id=?",id);
  assertEquals(false,row.get("verified"));assertEquals(1500,((Number)row.get("confirmed_seconds")).intValue());assertEquals(time,((Timestamp)row.get("completed_at")).toInstant());
 }
 @Test void staleGroupParticipationCannotBeReplacedByIndividualRecording(){
  var room=rooms.create(new StudyRoomRequest("Protected group"));roomId=room.id();
  ledger.select(roomId,goal.getId());rooms.timer(roomId,new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.START));
  rooms.heartbeat(roomId,new StudyRoomHeartbeat(true));
  db.update("update study_ledger set last_seen_at=clock_timestamp()-interval '50 seconds' where user_id=?",user.getId());
  assertThrows(ConflictException.class,()->ledger.start(UUID.randomUUID(),goal.getId(),5));
  assertEquals("RUNNING",db.queryForObject("select state from study_ledger where user_id=?",String.class,user.getId()));
 }
 @Test void concurrentDevicesWithDifferentUuidsGetOnlyOneRecordingSlot() throws Exception {
  try(var pool=Executors.newFixedThreadPool(2)){
   var gate=new CountDownLatch(1);
   Callable<Boolean> begin=()->{login();try{gate.await();ledger.start(UUID.randomUUID(),goal.getId(),5);return true;}
    catch(ConflictException expected){return false;}finally{SecurityContextHolder.clearContext();}};
   var first=pool.submit(begin);var second=pool.submit(begin);gate.countDown();
   assertNotEquals(first.get(10,TimeUnit.SECONDS),second.get(10,TimeUnit.SECONDS));
   assertEquals(1,db.queryForObject("select count(*) from study_ledger where user_id=?",Integer.class,user.getId()));
  }
 }
 @Test void participantsKeepSeparateGoalsAndReconnectWithoutCreditingGap(){
  var room=rooms.create(new StudyRoomRequest("Two participants"));roomId=room.id();ledger.select(roomId,goal.getId());
  User peer=new User();String name="peer_"+UUID.randomUUID();peer.setUsername(name);peer.setEmail(name+"@invalid.test");peer.setPassword("test");peer.setRole(Role.USER);peer=users.saveAndFlush(peer);
  Goal peerGoal=new Goal();peerGoal.setUser(peer);peerGoal.setTopic("Peer private goal");peerGoal.setFrequency(1);peerGoal.setDuration(30);peerGoal=goals.saveAndFlush(peerGoal);
  try{
   SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(name,null,List.of()));
   rooms.join(new StudyRoomJoinRequest(room.inviteCode()));ledger.select(roomId,peerGoal.getId());
   assertEquals(peerGoal.getId(),ledger.selection(roomId).get("goalId"));
   login();assertEquals(goal.getId(),ledger.selection(roomId).get("goalId"));
   rooms.timer(roomId,new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.START));rooms.heartbeat(roomId,new StudyRoomHeartbeat(true));
   SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(name,null,List.of()));
   rooms.heartbeat(roomId,new StudyRoomHeartbeat(true));
   db.update("update study_ledger set observed_ms=60000,last_seen_at=clock_timestamp()-interval '50 seconds' where user_id=?",peer.getId());
   rooms.heartbeat(roomId,new StudyRoomHeartbeat(true));
   assertEquals(60000L,db.queryForObject("select observed_ms from study_ledger where user_id=?",Long.class,peer.getId()));
   db.update("update study_ledger set observed_ms=120000,last_seen_at=clock_timestamp()-interval '2 seconds',ends_at=clock_timestamp()-interval '1 second' where run_id in (select id from study_run where room_id=?)",roomId);
   db.update("update study_run set ends_at=clock_timestamp()-interval '1 second' where room_id=?",roomId);
   expiry.completeExpired();
   assertEquals(2L,((Number)ledger.summary(peerGoal.getId()).get("totalMinutes")).longValue());
   assertEquals(1L,analytics.stats(7).get("groupSessions"));
   login();assertEquals(2L,((Number)ledger.summary(goal.getId()).get("totalMinutes")).longValue());
  }finally{
   db.update("delete from study_room_member where user_id=?",peer.getId());goals.deleteById(peerGoal.getId());users.deleteById(peer.getId());login();
  }
 }

}
