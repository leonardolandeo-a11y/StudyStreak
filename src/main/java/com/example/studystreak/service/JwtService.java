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
        return generateToken(user, refreshExpiration, "refresh");
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


    /*
     fecha de expiracion
     */
    public Date extractExpiration(String token) {

        return extractAllClaims(token).getExpiration();
    }


    /*
     Comprueba si el token expiro ya
     */
    private boolean isTokenExpired(String token) {

        return extractExpiration(token).before(new Date());
    }


    /*
     Verificamos que:
     - El token pertenezca al usuario correcto
     - Que no haya expirado
     - Que sea un access token
     */
    public boolean isTokenValid(
            String token,
            String username
    ) {

        try {
            String tokenUsername = extractUsername(token);
            return tokenUsername.equals(username)
                    && "access".equals(extractTokenType(token))
                    && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }


    public boolean isRefreshTokenValid(String token, String username) {

        try {
            String tokenUsername = extractUsername(token);
            return tokenUsername.equals(username)
                    && "refresh".equals(extractTokenType(token))
                    && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}