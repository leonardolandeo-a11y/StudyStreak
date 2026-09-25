package com.example.studystreak.listener;

import com.example.studystreak.event.UserRegisteredEvent;
import com.example.studystreak.service.EmailService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

// @Component es la etiqueta que convierte esta clase en un bean
// bean -> objeto administrado por Spring IoC
@Component
public class UserEventListener {

    private final EmailService emailService;

    public UserEventListener(EmailService emailService) {
        this.emailService = emailService;
    }

    /*
    La anotacion @Async indica que este metodo se ejecuta
    en un hilo diferente.

    @TransactionalEventListener permite ejecutar el listener
    dependiendo del resultado de la transaccion.

    AFTER_COMMIT significa que solo se ejecuta si
    la transaccion termino correctamente.
     */
    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleUserRegisteredEvent(UserRegisteredEvent event) {

        emailService.sendWelcomeEmail(event.getEmail(), event.getUsername());
    }
}