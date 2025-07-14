const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Enviar email genérico
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: `"Destored" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email enviado: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Error enviando email:', error);
      throw new Error('Error enviando email');
    }
  }

  /**
   * Email de verificación de cuenta
   */
  async sendVerificationEmail(email, token, firstName) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const subject = 'Verifica tu cuenta en Destored';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifica tu cuenta</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a Destored!</h1>
          </div>
          <div class="content">
            <h2>Hola ${firstName},</h2>
            <p>Gracias por registrarte en Destored, la plataforma que conecta profesionales tecnológicos con clientes.</p>
            <p>Para completar tu registro y comenzar a usar tu cuenta, necesitas verificar tu dirección de email.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verificar mi cuenta</a>
            </p>
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p><strong>Este enlace expira en 24 horas.</strong></p>
            <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Destored. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Email de reset de contraseña
   */
  async sendPasswordResetEmail(email, token, firstName) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const subject = 'Resetear contraseña - Destored';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resetear contraseña</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Resetear contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${firstName},</h2>
            <p>Recibimos una solicitud para resetear la contraseña de tu cuenta en Destored.</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Resetear mi contraseña</a>
            </p>
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #ff6b6b;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expira en 1 hora</li>
                <li>Solo puedes usar este enlace una vez</li>
                <li>Si no solicitaste este cambio, ignora este email</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Destored. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Email de notificación de nueva aplicación
   */
  async sendNewApplicationNotification(clientEmail, clientName, projectTitle, professionalName) {
    const subject = `Nueva aplicación para tu proyecto: ${projectTitle}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nueva aplicación</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>¡Tienes una nueva aplicación!</h2>
          <p>Hola ${clientName},</p>
          <p><strong>${professionalName}</strong> se ha postulado para tu proyecto "<strong>${projectTitle}</strong>".</p>
          <p>Revisa su perfil y propuesta en tu dashboard.</p>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard/projects" 
               style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
              Ver aplicaciones
            </a>
          </p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(clientEmail, subject, html);
  }

  /**
   * Email de notificación de proyecto asignado
   */
  async sendProjectAssignedNotification(professionalEmail, professionalName, projectTitle, clientName) {
    const subject = `¡Felicidades! Has sido seleccionado para el proyecto: ${projectTitle}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Proyecto asignado</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🎉 ¡Felicidades!</h2>
          <p>Hola ${professionalName},</p>
          <p><strong>${clientName}</strong> te ha seleccionado para trabajar en el proyecto "<strong>${projectTitle}</strong>".</p>
          <p>Puedes comenzar a trabajar y comunicarte con el cliente desde tu dashboard.</p>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard/projects" 
               style="display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">
              Ver proyecto
            </a>
          </p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(professionalEmail, subject, html);
  }

  /**
   * Email de bienvenida después de verificación
   */
  async sendWelcomeEmail(email, firstName, role) {
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
    const subject = '¡Bienvenido a Destored!';
    
    const roleMessages = {
      client: {
        title: '¡Encuentra el profesional perfecto para tu proyecto!',
        content: 'Ahora puedes publicar proyectos, revisar aplicaciones y contratar a los mejores profesionales tecnológicos.',
        cta: 'Publicar mi primer proyecto'
      },
      professional: {
        title: '¡Comienza a trabajar en proyectos increíbles!',
        content: 'Completa tu perfil, añade tu portafolio y comienza a aplicar a proyectos que se ajusten a tus habilidades.',
        cta: 'Completar mi perfil'
      }
    };

    const roleData = roleMessages[role] || roleMessages.client;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenido a Destored</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1>${roleData.title}</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>¡Hola ${firstName}!</h2>
            <p>Tu cuenta ha sido verificada exitosamente. ${roleData.content}</p>
            <p style="text-align: center;">
              <a href="${dashboardUrl}" 
                 style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                ${roleData.cta}
              </a>
            </p>
            <h3>¿Qué puedes hacer ahora?</h3>
            <ul>
              ${role === 'client' ? `
                <li>Publicar proyectos detallados</li>
                <li>Revisar aplicaciones de profesionales</li>
                <li>Comunicarte directamente con candidatos</li>
                <li>Gestionar pagos de forma segura</li>
              ` : `
                <li>Completar tu perfil profesional</li>
                <li>Subir tu portafolio</li>
                <li>Aplicar a proyectos interesantes</li>
                <li>Ofrecer mentorías y consultas</li>
              `}
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Email de feedback de aplicación rechazada
   */
  async sendApplicationRejectionFeedback(professionalEmail, professionalName, projectTitle, feedback) {
    const subject = `Feedback sobre tu aplicación para "${projectTitle}"`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feedback de Aplicación</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px 0; }
          .feedback-box { background-color: #f1f3f4; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Feedback sobre tu aplicación</h1>
          </div>
          
          <div class="content">
            <p>Hola ${professionalName},</p>
            
            <p>Aunque tu aplicación para <strong>"${projectTitle}"</strong> no fue seleccionada en esta ocasión, el cliente quiso compartir algunos comentarios contigo que podrían ser útiles para futuras aplicaciones:</p>
            
            <div class="feedback-box">
              <strong>Feedback del cliente:</strong><br>
              ${feedback}
            </div>
            
            <p>Te animamos a seguir aplicando a proyectos que coincidan con tu experiencia. ¡No te desanimes!</p>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/projects" class="btn">Ver más proyectos</a>
            </p>
          </div>
          
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; 2024 Destored. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(professionalEmail, subject, html);
  }

  /**
   * Convertir HTML básico a texto plano
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = new EmailService();
