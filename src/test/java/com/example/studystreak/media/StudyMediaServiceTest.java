package com.example.studystreak.media;
import com.example.studystreak.model.*;
import com.example.studystreak.repository.*;
import com.example.studystreak.service.*;
import com.example.studystreak.exceptions.*;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.*;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StudyMediaServiceTest {
    final CurrentUserService current=mock(CurrentUserService.class);
    final StudyRoomRepository rooms=mock(StudyRoomRepository.class);
    final StudyRoomMemberRepository members=mock(StudyRoomMemberRepository.class);
    final RetiredMediaRoomRepository retired=mock(RetiredMediaRoomRepository.class);
    final RoomBanRepository bans=mock(RoomBanRepository.class);
    final StudyLedgerService ledger=mock(StudyLedgerService.class);
    final MediaConfiguration config=new MediaConfiguration();
    final LiveKitGateway gateway=new LiveKitGateway(config,new tools.jackson.databind.ObjectMapper());
    final StudyMediaService service=new StudyMediaService(current,rooms,members,config,gateway,retired,bans,ledger);
    final User host=mock(User.class), viewer=mock(User.class);
    StudyRoom room; StudyRoomMember hostMember, viewerMember;
    final String secret="test-only-secret-at-least-thirty-two-bytes";
    @BeforeEach void setup() {
        when(host.getId()).thenReturn(1L);when(host.getUsername()).thenReturn("Host");when(viewer.getId()).thenReturn(2L);when(viewer.getUsername()).thenReturn("Viewer");
        room=new StudyRoom(UUID.randomUUID(),"ABCDEFGHJK","Test",host,Instant.now());
        hostMember=new StudyRoomMember(room,host,Instant.now());viewerMember=new StudyRoomMember(room,viewer,Instant.now());
        when(current.getCurrentUserId()).thenReturn(1L);
        when(rooms.findByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(members.findByRoomIdAndUserId(room.getId(),1L)).thenReturn(Optional.of(hostMember));
        when(members.findByRoomIdAndUserId(room.getId(),2L)).thenReturn(Optional.of(viewerMember));
        when(members.findByRoomId(room.getId())).thenReturn(List.of(hostMember,viewerMember));
        config.setEnabled(true);config.setUrl("ws://localhost:7880");config.setInternalUrl("http://localhost:7880");config.setApiKey("test-key");config.setApiSecret(secret);
    }
    Claims claims(String token) { return Jwts.parser().verifyWith(Keys.hmacShaKeyFor(secret.getBytes())).build().parseSignedClaims(token).getPayload(); }
    @Test void hostTokenIsShortLivedScreenOnlyAndNotAdmin() {
        var token=service.token(room.getId());var claims=claims(token.token());var grant=(Map<?,?>)claims.get("video");
        assertEquals(token.epoch(),grant.get("room"));assertEquals(true,grant.get("canPublish"));
        assertEquals(List.of("screen_share"),grant.get("canPublishSources"));assertFalse(grant.containsKey("roomAdmin"));
        assertEquals(false,grant.get("canPublishData"));assertEquals(false,grant.get("canUpdateOwnMetadata"));
        assertTrue(claims.getExpiration().toInstant().isBefore(Instant.now().plusSeconds(61)));
        assertNotEquals(host.getId().toString(),claims.getSubject());
    }
    @Test void viewersOnlySubscribeAndDevicesReceiveDistinctIdentities() {
        when(current.getCurrentUserId()).thenReturn(2L);var first=service.token(room.getId());
        assertEquals(false,((Map<?,?>)claims(first.token()).get("video")).get("canPublish"));
        viewerMember.setLastMediaTokenAt(null);var next=service.token(room.getId());assertNotEquals(first.identity(),next.identity());
    }
    @Test void missingMembershipBansAndClosedRoomsDenyCredentials() {
        when(current.getCurrentUserId()).thenReturn(3L);assertThrows(ForbiddenException.class,()->service.token(room.getId()));
        when(current.getCurrentUserId()).thenReturn(2L);when(bans.existsById(room.getId()+":2")).thenReturn(true);
        assertThrows(ForbiddenException.class,()->service.token(room.getId()));
        assertThrows(ResourceNotFoundException.class,()->service.token(UUID.randomUUID()));
    }
    @Test void disabledServiceDoesNotIssueCredentials() {
        config.setEnabled(false);assertFalse(service.state(room.getId()).enabled());
        assertThrows(org.springframework.web.server.ResponseStatusException.class,()->service.token(room.getId()));
    }
    @Test void onlyHostCanGrantAndRevocationRotatesNamespace() {
        when(current.getCurrentUserId()).thenReturn(2L);assertThrows(ForbiddenException.class,()->service.permission(room.getId(),2,true));
        when(current.getCurrentUserId()).thenReturn(1L);String initial=service.state(room.getId()).epoch();
        service.permission(room.getId(),2,true);assertTrue(viewerMember.isMediaPublisher());
        String granted=service.state(room.getId()).epoch();assertNotEquals(initial,granted);
        service.permission(room.getId(),2,false);assertFalse(viewerMember.isMediaPublisher());
        assertNotEquals(granted,service.state(room.getId()).epoch());verify(retired,times(2)).save(any());
    }
    @Test void kickPersistsBanAndCancelsOnlyThatUsersParticipation() {
        service.state(room.getId());service.kick(room.getId(),2);
        verify(bans).save(any());verify(members).delete(viewerMember);verify(ledger).leave(room.getId(),2);
        verify(retired).save(any());assertThrows(ConflictException.class,()->service.kick(room.getId(),1));
    }
    @Test void expiredTokensAreRejectedAndRoomGrantCannotAuthorizeAnotherRoom() {
        String jwt=gateway.sign("opaque","name",Map.of("room","room-A","roomJoin",true),Instant.now().minusSeconds(120));
        assertThrows(ExpiredJwtException.class,()->claims(jwt));
        assertNotEquals("room-B",((Map<?,?>)claims(service.token(room.getId()).token()).get("video")).get("room"));
    }
    @Test void unauthenticatedIdentityCannotReachTokenGeneration() {
        when(current.getCurrentUserId()).thenThrow(new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("required"));
        assertThrows(org.springframework.security.authentication.AuthenticationCredentialsNotFoundException.class,()->service.token(room.getId()));
        verifyNoInteractions(rooms);
    }
}
