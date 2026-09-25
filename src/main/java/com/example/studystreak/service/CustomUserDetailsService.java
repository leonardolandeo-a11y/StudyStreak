package com.example.studystreak.service;

import com.example.studystreak.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import com.example.studystreak.model.User;

@Service
public class CustomUserDetailsService  implements UserDetailsService {
    // UserDetailsService is an interface that requires the method loadUserByUsername
    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository){
        this.userRepository = userRepository;
    }
    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException{
        User user = userRepository.findByUsername(username).orElseThrow(); // Exception (Not implemented yet)

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();

    }



}
