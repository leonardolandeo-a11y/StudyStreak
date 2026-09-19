package com.example.studystreak.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender emailSender;
    //JavaEmailSender es una interfaz integrada por la dependencia springboot starter email.
    // La inyectamos para que se encargue de enviar los correos por nosotros
    public EmailService(JavaMailSender emailSender) {
        this.emailSender = emailSender;
    }
    public void sendWelcomeEmail(String toEmail, String username ) {
        SimpleMailMessage message = new SimpleMailMessage();
        //define quien envia el correo
        message.setFrom("nobody@gmail.com");
        //define a quien se envia
        message.setTo(toEmail);
        //define el cuerpo del email
        message.setSubject("🚀 ¡Bienvenido a StudyStreak, " + username + "!");
        message.setText("¡Hola, " + username + "! 👋\n\n" +
                "🎉 ¡Qué emoción tenerte por aquí! Ya diste el primer paso para transformar tus hábitos de estudio y alcanzar tus metas.\n\n" +
                "🔥 Con StudyStreak podrás mantener el enfoque, registrar tus avances y construir una racha imparable día a día.\n\n" +
                "💡 Estamos felices de acompañarte en este viaje. ¡A romperla!\n\n" +
                "Atentamente,\n" +
                "El equipo de StudyStreak 🚀📚");
        emailSender.send(message);
    }

}
