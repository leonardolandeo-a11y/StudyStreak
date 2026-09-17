package com.example.studystreak.service;


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
    public String generateToken(String username){
        // builder creates the token
        return Jwts.builder().subject(username) // Token belongs to the user
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())  // Token use the secret key
                .compact(); // Convert everything into the final token string  (header.payload.signature)
    }

    public String extractUsername(String token){
        return extractAllClaims(token).getSubject();
    }
    public Boolean isTokenValid(String token, String username){
        try {
            String tokenUsername = extractUsername(token);
            return tokenUsername.equals(username);
        }catch (Exception e){ // Exception (No implemented yet)
            return false;
        }
    }
}
