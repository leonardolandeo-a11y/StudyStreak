package com.example.studystreak.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender emailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    // JavaMailSender es una interfaz de Spring que permite enviar correos
    public EmailService(JavaMailSender emailSender) {
        this.emailSender = emailSender;
    }

    public void sendWelcomeEmail(String toEmail, String username) {

        SimpleMailMessage message = new SimpleMailMessage();

        // Define quién envía el correo
        message.setFrom(senderEmail);

        // Define a quién se envía
        message.setTo(toEmail);

        // Asunto
        message.setSubject("🚀 ¡Bienvenido a StudyStreak, " + username + "!");

        // Cuerpo
        message.setText(
                        "¡Hola, " + username + "! 👋\n\n" +
                        "🎉 ¡Qué emoción tenerte por aquí! Ya diste el primer paso para transformar tus hábitos de estudio y alcanzar tus metas.\n\n" +
                        "🔥 Con StudyStreak podrás mantener el enfoque, registrar tus avances y construir una racha imparable día a día.\n\n" +
                        "💡 Estamos felices de acompañarte en este viaje. ¡A romperla!\n\n" +
                        "Atentamente,\n" +
                        "El equipo de StudyStreak 🚀📚"
        );

        emailSender.send(message);
    }
}