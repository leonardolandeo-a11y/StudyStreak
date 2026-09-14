package com.example.studystreak.service;

import com.example.studystreak.dto.Validation.ValidationDTO;
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
            StreakService streakService) {

        this.validationRepository = validationRepository;
        this.dailyRecordRepository = dailyRecordRepository;
        this.userRepository = userRepository;
        this.modelMapper = modelMapper;
        this.streakService = streakService;
    }

    @Transactional
    public ValidationDTO createValidation(Long dailyRecordId, Long validatorId, ValidationDTO validationDTO) {

        if (validationDTO.getApproved() == null) {
            throw new IllegalArgumentException(
                    "Approved value is required"
            );
        }

        DailyRecord dailyRecord = dailyRecordRepository.findById(dailyRecordId)
                .orElseThrow();

        User validator = userRepository.findById(validatorId)
                .orElseThrow();

        Long ownerId = dailyRecord.getGoal().getUser().getId();

        if (ownerId.equals(validatorId)) {
            throw new IllegalStateException(
                    "A user cannot validate their own daily record"
            );
        }

        if (validationRepository.existsByDailyRecordId(dailyRecordId)) {
            throw new IllegalStateException(
                    "Daily record already validated"
            );
        }

        Validation validation = modelMapper.map(validationDTO, Validation.class);

        validation.setDailyRecord(dailyRecord);
        validation.setValidator(validator);

        validation = validationRepository.save(validation);

        dailyRecord.setValidation(validation);

        streakService.recalculateStreak(dailyRecord.getGoal().getId());

        return modelMapper.map(validation, ValidationDTO.class);
    }

    public ValidationDTO getDailyRecordValidation(Long dailyRecordId) {
        Validation validation = validationRepository
                .findByDailyRecordId(dailyRecordId)
                .orElseThrow();

        return modelMapper.map(validation, ValidationDTO.class);
    }

    @Transactional
    public ValidationDTO updateValidation(Long validationId, ValidationDTO validationDTO) {

        if (validationDTO.getApproved() == null) {
            throw new IllegalArgumentException(
                    "Approved value is required"
            );
        }

        Validation validation = validationRepository.findById(validationId)
                .orElseThrow();

        validation.setApproved(validationDTO.getApproved());
        validation.setComment(validationDTO.getComment());

        validation = validationRepository.save(validation);

        streakService.recalculateStreak(validation.getDailyRecord().getGoal().getId());

        return modelMapper.map(validation, ValidationDTO.class);
    }
}
