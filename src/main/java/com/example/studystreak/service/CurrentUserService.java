package com.example.studystreak.service;

import com.example.studystreak.model.User;
import com.example.studystreak.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /*
     Obtiene el usuario autenticado actualmente.
     JwtRequestFilter ya colocó previamente un Authentication
     dentro del SecurityContext.
     */
    public User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        /*
         En un endpoint protegido normalmente nunca debería
         ocurrir esto, porque Spring Security ya exige autenticación.
         */
        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new AuthenticationCredentialsNotFoundException(
                    "Authenticated user not found"
            );
        }

        /*
         authentication.getName() devuelve el username porque
         nuestro UserDetails utiliza username como identificador.
         */
        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found: " + username
                        )
                );
    }

    /*
     Atajo para los lugares donde solo necesitamos el ID.
     */
    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }
}