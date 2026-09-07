package com.example.studystreak.service;

import com.example.studystreak.repository.ValidationRepository;
import org.springframework.stereotype.Service;

@Service
public class ValidationService {
    private final ValidationRepository validationRepository;

    public ValidationService(ValidationRepository validationRepository) {
        this.validationRepository = validationRepository;
    }
}
