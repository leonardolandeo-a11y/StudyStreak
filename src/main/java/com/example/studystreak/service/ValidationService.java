package com.example.studystreak.service;

import com.example.studystreak.dto.Validation.ValidationRequestDTO;
import com.example.studystreak.dto.Validation.ValidationResponseDTO;

import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;

import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.TrackingLink;
import com.example.studystreak.model.TrackingStatus;
import com.example.studystreak.model.User;
import com.example.studystreak.model.Validation;

import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.ValidationRepository;

import org.modelmapper.ModelMapper;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ValidationService {

    private final ValidationRepository validationRepository;
    private final DailyRecordRepository dailyRecordRepository;

    /*
     * Se utiliza para comprobar si el usuario autenticado
     * tiene un TrackingLink válido con el dueño del DailyRecord.
     */
    private final TrackingLinkRepository trackingLinkRepository;

    private final ModelMapper modelMapper;
    private final StreakService streakService;

    /*
     * Permite obtener al usuario autenticado a partir
     * del SecurityContext.
     *
     * Ya no confiamos en un userId enviado por el cliente.
     */
    private final CurrentUserService currentUserService;

    public ValidationService(
            ValidationRepository validationRepository,
            DailyRecordRepository dailyRecordRepository,
            TrackingLinkRepository trackingLinkRepository,
            ModelMapper modelMapper,
            StreakService streakService,
            CurrentUserService currentUserService
    ) {

        this.validationRepository = validationRepository;
        this.dailyRecordRepository = dailyRecordRepository;
        this.trackingLinkRepository = trackingLinkRepository;
        this.modelMapper = modelMapper;
        this.streakService = streakService;
        this.currentUserService = currentUserService;
    }


    /*
     * Busca un DailyRecord y comprueba además que pertenezca
     * realmente al Goal indicado en la URL.
     *
     * Ejemplo:
     *
     * /goals/10/daily-records/25/validation
     *
     * No basta con que exista el DailyRecord 25.
     * También debe pertenecer al Goal 10.
     */
    private DailyRecord getDailyRecordInGoal(
            Long goalId,
            Long dailyRecordId
    ) {

        DailyRecord dailyRecord = dailyRecordRepository.findById(dailyRecordId)
                        .orElseThrow(() -> new ResourceNotFoundException("Daily record not found with id: "
                                                + dailyRecordId));

        /*
         * Evita acceder a un DailyRecord usando el ID
         * de otro Goal en la URL.
         */
        if (!dailyRecord
                .getGoal()
                .getId()
                .equals(goalId)) {

            throw new ResourceNotFoundException(
                    "Daily record with id: " + dailyRecordId + " does not belong to goal: " + goalId);
        }

        return dailyRecord;
    }


    /*
     * Comprueba que exista una relación de seguimiento
     * entre el dueño del Goal y el usuario que quiere validar.
     *
     * Además, la relación tiene que estar ACCEPTED.
     *
     * PENDING y REJECTED no permiten validar registros.
     */
    private void validateTrackingPermission(Long ownerId, Long validatorId) {

        TrackingLink trackingLink = trackingLinkRepository.findLinkBetweenUsers(ownerId, validatorId)
                        .orElseThrow(() -> new ForbiddenException("You are not allowed to validate "
                                                + "this user's daily records"));

        /*
         * No basta con que exista la invitación.
         * Tiene que haber sido aceptada.
         */
        if (trackingLink.getStatus() != TrackingStatus.ACCEPTED) {

            throw new ForbiddenException("Tracking link must be accepted " + "before validating daily records");
        }
    }


    /*
     * Crea una Validation para un DailyRecord.
     *
     * Reglas:
     *
     * 1. approved es obligatorio.
     * 2. El DailyRecord debe pertenecer al Goal de la URL.
     * 3. El usuario no puede validar su propio registro.
     * 4. Debe existir un TrackingLink ACCEPTED.
     * 5. Solo puede existir una Validation por DailyRecord.
     */
    @Transactional
    public ValidationResponseDTO createValidation(
            Long goalId,
            Long dailyRecordId,
            ValidationRequestDTO validationRequest
    ) {

        if (validationRequest.getApproved() == null) {
            throw new IllegalArgumentException("Approved value is required");
        }


        /*
         * Verificamos simultáneamente:
         *
         * - que exista el DailyRecord
         * - que pertenezca al Goal recibido
         */
        DailyRecord dailyRecord = getDailyRecordInGoal(goalId, dailyRecordId);


        /*
         * El usuario autenticado se obtiene desde
         * SecurityContext mediante CurrentUserService.
         */
        User validator = currentUserService.getCurrentUser();

        Long validatorId = validator.getId();


        /*
         * Obtenemos al dueño del DailyRecord a través de:
         *
         * DailyRecord -> Goal -> User
         */
        Long ownerId = dailyRecord.getGoal().getUser().getId();


        /*
         * Un usuario no puede validar su propio progreso.
         */
        if (ownerId.equals(validatorId)) {

            throw new ConflictException("A user cannot validate their own daily record");
        }


        /*
         * El usuario autenticado debe ser un compañero
         * de seguimiento aceptado del dueño.
         */
        validateTrackingPermission(ownerId, validatorId);
        /*
         * Validation es un recurso singular:
         * un DailyRecord solo puede tener una.
         */
        if (validationRepository.existsByDailyRecordId(dailyRecordId)) {
            throw new ConflictException("Daily record already validated");
        }
        Validation validation = modelMapper.map(validationRequest, Validation.class);

        /*
         * Asociamos explícitamente:
         *
         * - DailyRecord validado
         * - usuario que realizó la validación
         */
        validation.setDailyRecord(dailyRecord);
        validation.setValidator(validator);

        Validation savedValidation = validationRepository.save(validation);
        /*
         * Mantenemos sincronizada la relación
         * DailyRecord -> Validation.
         */
        dailyRecord.setValidation(savedValidation);
        /*
         * La validación puede modificar la racha,
         * así que la recalculamos después de guardarla.
         */
        streakService.recalculateStreak(goalId);
        return modelMapper.map(savedValidation, ValidationResponseDTO.class);
    }


    /*
     * Obtiene la Validation de un DailyRecord.
     *
     * Pueden verla:
     *
     * - el dueño del DailyRecord
     * - el usuario que realizó la Validation
     *
     * Otros usuarios reciben Forbidden.
     */
    public ValidationResponseDTO getDailyRecordValidation(Long goalId, Long dailyRecordId) {
        /*
         * Comprobamos primero que el DailyRecord
         * pertenezca realmente al Goal de la URL.
         */
        DailyRecord dailyRecord = getDailyRecordInGoal(goalId, dailyRecordId);
        Validation validation = validationRepository.findByDailyRecordId(dailyRecordId)
                        .orElseThrow(() -> new ResourceNotFoundException("Validation not found for "
                                                + "daily record id: "
                                                + dailyRecordId));

        Long currentUserId = currentUserService.getCurrentUserId();

        Long ownerId = dailyRecord
                        .getGoal()
                        .getUser()
                        .getId();

        Long validatorId = validation
                        .getValidator()
                        .getId();
        /*
         * El usuario debe ser:
         *
         * - dueño del DailyRecord
         * o
         * - validator de esta Validation
         */
        if (!currentUserId.equals(ownerId)
                && !currentUserId.equals(validatorId)) {

            throw new ForbiddenException(
                    "You cannot access this validation"
            );
        }
        return modelMapper.map(validation, ValidationResponseDTO.class);
    }
    /*
     * Actualiza una Validation existente.
     *
     * Solamente el usuario que creó originalmente
     * la Validation puede modificarla.
     */
    @Transactional
    public ValidationResponseDTO updateValidation(Long goalId, Long dailyRecordId,
                                                  ValidationRequestDTO validationRequest) {

        if (validationRequest.getApproved() == null) {
            throw new IllegalArgumentException(
                    "Approved value is required"
            );
        }
        /*
         * Comprobamos que dailyRecordId corresponda
         * realmente al goalId recibido.
         */
        DailyRecord dailyRecord =
                getDailyRecordInGoal(
                        goalId,
                        dailyRecordId
                );
        Validation validation =
                validationRepository
                        .findByDailyRecordId(dailyRecordId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Validation not found for "
                                                + "daily record id: "
                                                + dailyRecordId
                                )
                        );
        Long currentUserId = currentUserService.getCurrentUserId();
        Long validatorId = validation
                        .getValidator()
                        .getId();
        /*
         * El dueño del DailyRecord no puede modificar
         * la decisión realizada por su compañero.
         *
         * Solo el validator original puede hacerlo.
         */
        if (!currentUserId.equals(validatorId)) {
            throw new ForbiddenException(
                    "Only the validator can update this validation"
            );
        }

        Long ownerId = dailyRecord
                        .getGoal()
                        .getUser()
                        .getId();

        /*
         * Comprobamos nuevamente que la relación
         * entre ambos usuarios siga siendo válida.
         */
        validateTrackingPermission(
                ownerId,
                currentUserId
        );
        validation.setApproved(
                validationRequest.getApproved()
        );
        validation.setComment(
                validationRequest.getComment()
        );
        Validation updatedValidation = validationRepository.save(validation);
        /*
         * Cambiar approved puede afectar la racha,
         * por lo que debemos recalcularla.
         */
        streakService.recalculateStreak(goalId);


        return modelMapper.map(updatedValidation, ValidationResponseDTO.class);
    }
}