package com.example.studystreak.service;


import com.example.studystreak.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.SecretKey;
import io.jsonwebtoken.security.Keys;

import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private SecretKey getSigningKey(){
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Claims information stored in the Payload section
    private Claims extractAllClaims(String token){
        // parser read the token
        return Jwts.parser().verifyWith(getSigningKey()) // Verify the token signature using our secret key
                .build() // Create the actual object
                .parseSignedClaims(token) // Parse and verify the signed JWT containing Claims
                .getPayload();  // From the 3 parts we just need the Payload()
    }

    /*
     Ahora la firma es generateToken(User user):
     Recibimos el User completo porque necesitamos más información
     que únicamente el username.
     Se añaden mas claims: id, email, role
     */
    public String generateToken(User user){
        return generateToken(user, jwtExpiration, "access");
    }

    public String generateRefreshToken(User user){
        return generateRefreshToken(user, UUID.randomUUID());
    }

    public String generateRefreshToken(User user, UUID sessionId) {
        // A fresh jti is mandatory: tokens issued in the same millisecond must differ.
        return Jwts.builder().subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("type", "refresh")
                .claim("sid", sessionId.toString())
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    private String generateToken(User user, long expiration, String type){
        // builder creates the token
        return Jwts.builder().subject(user.getUsername()) // Token belongs to the user
                .claim("userId", user.getId())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("type", type)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())  // Token use the secret key
                .compact(); // Convert everything into the final token string (header.payload.signature)
    }

    public String extractRefreshSessionId(String token) {
        return extractAllClaims(token).get("sid", String.class);
    }

    public String extractRefreshTokenId(String token) {
        return extractAllClaims(token).getId();
    }

    public String extractUsername(String token){
        return extractAllClaims(token).getSubject();
    }

    /*
     Extrae el userId que guardamos al crear el JWT.
     NOTA: Usamos Number en lugar de Long directamente porque
     JSON puede interpretar el numero como Integer/Long
     */
    public Long extractUserId(String token) {

        Number userId = extractAllClaims(token).get("userId", Number.class);
        return userId.longValue();
    }


    /*
    Obtiene el email del token
     */
    public String extractEmail(String token) {

        return extractAllClaims(token).get("email", String.class);
    }


    /*
     Obtiene el rol del usuario
     */
    public String extractRole(String token) {

        return extractAllClaims(token).get("role", String.class);
    }


    public String extractTokenType(String token) {

        return extractAllClaims(token).get("type", String.class);
    }


    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    /**
     * Verify the signed token against the current database account, not just its username.
     * Recreated accounts, disabled users, and changed roles cannot reuse older tokens.
     */
    public boolean isTokenValid(String token, User user) {
        return isTokenValidForUser(token, user, "access");
    }

    public boolean isRefreshTokenValid(String token, User user) {
        return isTokenValidForUser(token, user, "refresh");
    }

    private boolean isTokenValidForUser(String token, User user, String expectedType) {
        if (user == null || user.getId() == null || user.getRole() == null
                || !Boolean.TRUE.equals(user.getActive())) {
            return false;
        }

        try {
            Claims claims = extractAllClaims(token);
            Number tokenUserId = claims.get("userId", Number.class);
            Date expiresAt = claims.getExpiration();

            return tokenUserId != null
                    && user.getId().longValue() == tokenUserId.longValue()
                    && user.getUsername().equals(claims.getSubject())
                    && user.getRole().name().equals(claims.get("role", String.class))
                    && expectedType.equals(claims.get("type", String.class))
                    && (!"refresh".equals(expectedType)
                        || (claims.getId() != null && claims.get("sid", String.class) != null))
                    && expiresAt != null
                    && expiresAt.after(new Date());
        } catch (Exception exception) {
            return false;
        }
    }
}
