package com.example.studystreak.listener;


import com.example.studystreak.event.UserRegisteredEvent;
import com.example.studystreak.service.EmailService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

// @Component es la etiqurta que convierte esta clase en una bean
//bean -> objeto administrado por spring IoC
@Component
public class UserEventListener {
    private final EmailService emailService;

    public UserEventListener(EmailService emailService) {
        this.emailService = emailService;
    }
    /*
    la anotacion @Async le indica al programa que este metodo se ejecute en un hilo difenrete
    la anotacion @transactionaleventListener sirve para gestionar la transaccion de base de datos:
    se indica que ejecuta solo si la transaccion se completo con exito
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleUserRegisteredEvent(UserRegisteredEvent event) {
        emailService.sendWelcomeEmail(event.getEmail(),event.getUsername());
    }
}
