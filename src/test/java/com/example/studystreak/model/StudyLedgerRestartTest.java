package com.example.studystreak.model;
import com.example.studystreak.repository.*;
import com.example.studystreak.service.StudyLedgerService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class StudyLedgerRestartTest {
 @Autowired UserRepository users;
 @Autowired GoalRepository goals;
 @Autowired StudyLedgerService ledger;
 @Autowired org.springframework.jdbc.core.JdbcTemplate db;
 @Autowired com.example.studystreak.service.StudyAnalyticsService analytics;
 private static Long userId,goalId;
 private static String username;
 private static final UUID session=UUID.randomUUID(), completed=UUID.randomUUID();
 private void login(){SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(username,null,List.of()));}
 @Test @Order(1) @DirtiesContext(methodMode=DirtiesContext.MethodMode.AFTER_METHOD)
 void persistBeforeStoppingSpring(){
  User user=new User();username="restart_"+UUID.randomUUID();user.setUsername(username);user.setEmail(username+"@invalid.test");user.setPassword("test");user.setRole(Role.USER);user=users.saveAndFlush(user);userId=user.getId();
  Goal goal=new Goal();goal.setUser(user);goal.setTopic("Restart proof");goal.setFrequency(1);goal.setDuration(30);goal=goals.saveAndFlush(goal);goalId=goal.getId();login();
  ledger.start(completed,goalId,5);
  db.update("update study_ledger set observed_ms=300000,last_seen_at=clock_timestamp()-interval '2 seconds',ends_at=clock_timestamp()-interval '1 second' where id=?",completed);
  ledger.complete(goalId,completed,5);
  ledger.start(session,goalId,5);ledger.pulse(session,"PAUSE");SecurityContextHolder.clearContext();
 }
 @Test @Order(2)
 void recoverAfterSpringRestarts(){
  login();try{
   assertEquals(5L, ((Number)ledger.summary(goalId).get("totalMinutes")).longValue());
   assertEquals(5d, ((Number)analytics.stats(7).get("verifiedMinutes")).doubleValue());
   assertEquals("COMPLETE",ledger.complete(goalId,completed,5).get("state"));
   assertEquals(1L, ((Number)analytics.stats(7).get("completedSessions")).longValue());
   var restored=(Map<?,?>)ledger.active().get("session");assertNotNull(restored);assertEquals(session,restored.get("id"));assertEquals("PAUSED",restored.get("state"));
   ledger.start(session,goalId,5);assertEquals(session,((Map<?,?>)ledger.active().get("session")).get("id"));
  }finally{goals.deleteById(goalId);users.deleteById(userId);SecurityContextHolder.clearContext();}
 }
}
