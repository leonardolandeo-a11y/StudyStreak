package com.example.studystreak.security;

import com.example.studystreak.service.CustomUserDetailsService;
import com.example.studystreak.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {
    // OncePerRequestFilter: Allow us to execute the filter one time for each request
    // The filter intercepts each request and checks whether it contains a valid JWT so spring security can identify the authenticated user

    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;

    public JwtRequestFilter(JwtService jwtService, CustomUserDetailsService customUserDetailsService){
        this.jwtService = jwtService;
        this.customUserDetailsService = customUserDetailsService;
    }
    // HttpServletRequest request -> the request made by the current user
    // HttpServletResponse response -> the response that will be sent back to the current user
    // FilterChain filterChain -> Allows the request to continue to the next filter and eventually reach the controller
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        // the header has the form:   Authorization: Bearer token
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader== null || !authorizationHeader.startsWith("Bearer ")){
            filterChain.doFilter(request,response);
            return;
        }
        // Create a string that start with the token (Eliminating Bearer )
        String token = authorizationHeader.substring(7);
        try{

            String username = jwtService.extractUsername(token);
            String tokenRole = jwtService.extractRole(token); // NUEVO: Se extrae el rol tambien
            // SecurityContextHolder.getContext() -> Give me the current security information for this request (Person who make the request)
            // SecurityContextHolder.getContext().getAuthentication() -> Give me the authentication information of the current user for this request
            // SecurityContextHolder.getContext().getAuthentication() == null -> No user has been authenticated yet for this request
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null){
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
                // False for exceptions

                boolean validToken = jwtService.isTokenValid(token, userDetails.getUsername());
                String expectedAuthority = "ROLE_" + tokenRole;
                boolean validRole = userDetails.getAuthorities().stream().anyMatch(authority
                                -> authority.getAuthority().equals(expectedAuthority));

                if (validToken && validRole) {
                    // UsernamePasswordAuthenticationToken
                    // principal    → who the user is
                    // credentials  → proof/secret used to authenticate
                    // authorities  → what the user is allowed to do ("USER")

                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                    );
                    // WebAuthenticationDetailsSource add more information to the token (IP, sessionID if one exists)
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    // Stores the authenticated user in Spring Security's current SecurityContext
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }


            }
        }catch (Exception e){
            // Exception (Not Implemented yet)
            //lo que dice el de arriba
            SecurityContextHolder.clearContext();

        }

        filterChain.doFilter(request,response);

    }


}
