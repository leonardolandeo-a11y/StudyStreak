package com.example.studystreak.service;

import com.example.studystreak.dto.Validation.ValidationRequestDTO;
import com.example.studystreak.dto.Validation.ValidationResponseDTO;
import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.User;
import com.example.studystreak.model.Validation;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.UserRepository;
import com.example.studystreak.repository.ValidationRepository;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ValidationService {

    private final ValidationRepository validationRepository;
    private final DailyRecordRepository dailyRecordRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final StreakService streakService;

    public ValidationService(
            ValidationRepository validationRepository,
            DailyRecordRepository dailyRecordRepository,
            UserRepository userRepository,
            ModelMapper modelMapper,
            StreakService streakService
    ) {
        this.validationRepository = validationRepository;
        this.dailyRecordRepository = dailyRecordRepository;
        this.userRepository = userRepository;
        this.modelMapper = modelMapper;
        this.streakService = streakService;
    }

    @Transactional
    public ValidationResponseDTO createValidation(Long dailyRecordId, Long validatorId,
            ValidationRequestDTO validationRequest) {

        if (validationRequest.getApproved() == null) {
            throw new IllegalArgumentException(
                    "Approved value is required");
        }

        DailyRecord dailyRecord = dailyRecordRepository.findById(dailyRecordId)
                        .orElseThrow(() -> new ResourceNotFoundException("Daily record not found with id: "
                                                + dailyRecordId)
                        );

        User validator = userRepository.findById(validatorId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with id: "
                                                + validatorId)
                        );

        Long ownerId =
                dailyRecord.getGoal().getUser().getId();


        if (ownerId.equals(validatorId)) {
            throw new ConflictException(
                    "A user cannot validate their own daily record"
            );
        }

        if (validationRepository.existsByDailyRecordId(dailyRecordId)) {
            throw new ConflictException(
                    "Daily record already validated"
            );
        }

        Validation validation = modelMapper.map(validationRequest, Validation.class);

        validation.setDailyRecord(dailyRecord);
        validation.setValidator(validator);

        Validation savedValidation = validationRepository.save(validation);
        dailyRecord.setValidation(savedValidation);


        streakService.recalculateStreak(dailyRecord.getGoal().getId());

        return modelMapper.map(savedValidation, ValidationResponseDTO.class);
    }

    public ValidationResponseDTO getDailyRecordValidation(
            Long dailyRecordId
    ) {
        Validation validation = validationRepository.findByDailyRecordId(dailyRecordId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                        "Validation not found for daily record id: "
                                                + dailyRecordId
                                )
                        );

        return modelMapper.map(validation, ValidationResponseDTO.class
        );
    }

    @Transactional
    public ValidationResponseDTO updateValidation(Long dailyRecordId, ValidationRequestDTO validationRequest) {

        if (validationRequest.getApproved() == null) {
            throw new IllegalArgumentException("Approved value is required");
        }

        Validation validation = validationRepository.findByDailyRecordId(dailyRecordId)
                        .orElseThrow(() -> new ResourceNotFoundException("Validation not found for daily record id: "
                                                + dailyRecordId)
                        );

        validation.setApproved(validationRequest.getApproved());

        validation.setComment(validationRequest.getComment());

        Validation updatedValidation = validationRepository.save(validation);


        streakService.recalculateStreak(
                validation.getDailyRecord()
                        .getGoal()
                        .getId()
        );

        return modelMapper.map(updatedValidation, ValidationResponseDTO.class);
    }
}