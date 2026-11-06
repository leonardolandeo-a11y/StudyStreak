package com.example.studystreak.media;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

/** LiveKit's documented JWT/Twirp wire protocol, using the application's existing JWT library. */
@Component
public class LiveKitGateway {
    private final MediaConfiguration config;
    private final ObjectMapper json;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
    public LiveKitGateway(MediaConfiguration config, ObjectMapper json) { this.config = config; this.json = json; }

    String sign(String identity, String name, Map<String, Object> grant, Instant now) {
        return Jwts.builder().issuer(config.getApiKey()).subject(identity)
                .notBefore(Date.from(now.minusSeconds(5))).expiration(Date.from(now.plusSeconds(60)))
                .claim("name", name).claim("video", grant)
                .signWith(Keys.hmacShaKeyFor(config.getApiSecret().getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256).compact();
    }
    public String token(String room, String identity, String name, boolean publish) {
        return sign(identity, name, Map.of("room", room, "roomJoin", true, "canSubscribe", true,
                "canPublish", publish, "canPublishSources", List.of("screen_share"),
                "canPublishData", false, "canUpdateOwnMetadata", false), Instant.now());
    }
    private String call(String method, String room, Map<String, Object> body) throws Exception {
        String jwt = sign("server", "", Map.of("room", room, "roomAdmin", true, "roomCreate", true), Instant.now());
        HttpRequest request = HttpRequest.newBuilder(URI.create(config.getInternalUrl().replaceAll("/$", "")
                        + "/twirp/livekit.RoomService/" + method)).timeout(Duration.ofSeconds(5))
                .header("Authorization", "Bearer " + jwt).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 404) return "{}";
        if (response.statusCode() / 100 != 2) throw new IllegalStateException("Media administration unavailable");
        return response.body();
    }
    /** Remove publish permissions first, then all connections. Old JWTs remain confined to this retired room. */
    public void retire(String room) throws Exception {
        var participants = json.readTree(call("ListParticipants", room, Map.of("room", room))).path("participants");
        for (var participant : participants) {
            String identity = participant.path("identity").asText();
            call("UpdateParticipant", room, Map.of("room", room, "identity", identity,
                    "permission", Map.of("canPublish", false, "canSubscribe", false, "canPublishData", false)));
            call("RemoveParticipant", room, Map.of("room", room, "identity", identity));
        }
        call("DeleteRoom", room, Map.of("room", room));
    }
}
