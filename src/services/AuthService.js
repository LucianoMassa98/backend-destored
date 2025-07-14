const { User, Professional, Client } = require('../db/models');
const AuthUtils = require('../utils/authUtils');
const EmailService = require('./EmailService');
const crypto = require('crypto');
const { Op } = require('sequelize');

class AuthService {
  /**
   * Registrar nuevo usuario
   */
  static async register(userData) {
    const { email, password, firstName, lastName, role, phone, acceptTerms } = userData;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Ya existe un usuario con este email');
    }

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Crear usuario
    const user = await User.create({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      role,
      phone,
      verification_token: verificationToken,
      verification_token_expires: verificationExpires,
      preferences: {
        acceptedTerms: acceptTerms,
        acceptedAt: new Date()
      }
    });

    // Crear perfil específico según el rol
    if (role === 'professional') {
      await Professional.create({
        user_id: user.id,
        is_available: false, // Disponible después de completar perfil
        is_verified: false
      });
    } else if (role === 'client') {
      await Client.create({
        user_id: user.id
      });
    }

    // Enviar email de verificación
    await EmailService.sendVerificationEmail(email, verificationToken, firstName);

    return {
      user: user.getPublicData(),
      message: 'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.'
    };
  }

  /**
   * Iniciar sesión
   */
  static async login(email, password, rememberMe = false) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar si la cuenta está bloqueada
    if (user.locked_until && user.locked_until > new Date()) {
      const timeLeft = Math.ceil((user.locked_until - new Date()) / 60000);
      throw new Error(`Cuenta bloqueada. Intenta de nuevo en ${timeLeft} minutos.`);
    }

    // Verificar contraseña
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      // Incrementar intentos fallidos
      await this.handleFailedLogin(user);
      throw new Error('Credenciales inválidas');
    }

    // Verificar si la cuenta está activa
    if (!user.is_active) {
      throw new Error('Cuenta desactivada. Contacta al administrador.');
    }

    // Reset intentos fallidos y actualizar último login
    await user.update({
      login_attempts: 0,
      locked_until: null,
      last_login: new Date()
    });

    // Generar tokens
    const roleTranslations = {
      'client': 'cliente',
      'professional': 'profesional',
      'admin': 'administrador',
      'super_admin': 'super_administrador',
      'gerencia': 'gerencia'
    };

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: roleTranslations[user.role] || user.role
    };

    const accessToken = AuthUtils.generateToken(tokenPayload);
    const refreshToken = AuthUtils.generateRefreshToken(tokenPayload);

    // Guardar refresh token (en producción, usar Redis o base de datos)
    await user.update({
      metadata: {
        ...user.metadata,
        refreshToken: refreshToken,
        refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return {
      user: user.getPublicData(),
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    };
  }

  /**
   * Refrescar token de acceso
   */
  static async refreshToken(refreshToken) {
    try {
      const decoded = AuthUtils.verifyRefreshToken(refreshToken);
      
      const user = await User.findByPk(decoded.id);
      if (!user || !user.is_active) {
        throw new Error('Usuario no válido');
      }

      // Verificar si el refresh token es válido
      const storedRefreshToken = user.metadata?.refreshToken;
      const refreshTokenExpires = user.metadata?.refreshTokenExpires;

      if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
        throw new Error('Refresh token inválido');
      }

      if (new Date() > new Date(refreshTokenExpires)) {
        throw new Error('Refresh token expirado');
      }

      // Generar nuevo access token
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      const newAccessToken = AuthUtils.generateToken(tokenPayload);

      return {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      };

    } catch (error) {
      throw new Error('Refresh token inválido');
    }
  }

  /**
   * Verificar email
   */
  static async verifyEmail(token) {
    const user = await User.findOne({
      where: {
        verification_token: token,
        verification_token_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Token de verificación inválido o expirado');
    }

    await user.update({
      is_verified: true,
      verification_token: null,
      verification_token_expires: null
    });

    return {
      message: 'Email verificado exitosamente'
    };
  }

  /**
   * Reenviar email de verificación
   */
  static async resendVerification(email) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.is_verified) {
      throw new Error('El email ya está verificado');
    }

    // Generar nuevo token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.update({
      verification_token: verificationToken,
      verification_token_expires: verificationExpires
    });

    // Enviar email
    await EmailService.sendVerificationEmail(email, verificationToken, user.first_name);

    return {
      message: 'Email de verificación enviado'
    };
  }

  /**
   * Solicitar reset de contraseña
   */
  static async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Por seguridad, no revelar si el email existe
      return {
        message: 'Si el email existe, recibirás las instrucciones para resetear tu contraseña'
      };
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await user.update({
      reset_password_token: resetToken,
      reset_password_expires: resetExpires
    });

    // Enviar email
    await EmailService.sendPasswordResetEmail(email, resetToken, user.first_name);

    return {
      message: 'Si el email existe, recibirás las instrucciones para resetear tu contraseña'
    };
  }

  /**
   * Resetear contraseña
   */
  static async resetPassword(token, newPassword) {
    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Token de reset inválido o expirado');
    }

    await user.update({
      password: newPassword, // Se hasheará automáticamente por el hook
      reset_password_token: null,
      reset_password_expires: null,
      login_attempts: 0,
      locked_until: null
    });

    return {
      message: 'Contraseña actualizada exitosamente'
    };
  }

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isValidPassword = await user.checkPassword(currentPassword);
    if (!isValidPassword) {
      throw new Error('Contraseña actual incorrecta');
    }

    await user.update({
      password: newPassword // Se hasheará automáticamente
    });

    return {
      message: 'Contraseña actualizada exitosamente'
    };
  }

  /**
   * Cerrar sesión
   */
  static async logout(userId) {
    const user = await User.findByPk(userId);
    
    if (user) {
      // Limpiar refresh token
      await user.update({
        metadata: {
          ...user.metadata,
          refreshToken: null,
          refreshTokenExpires: null
        }
      });
    }

    return {
      message: 'Sesión cerrada exitosamente'
    };
  }

  /**
   * Manejar intento de login fallido
   */
  static async handleFailedLogin(user) {
    const maxAttempts = 5;
    const lockoutTime = 30 * 60 * 1000; // 30 minutos

    const newAttempts = user.login_attempts + 1;
    
    if (newAttempts >= maxAttempts) {
      await user.update({
        login_attempts: newAttempts,
        locked_until: new Date(Date.now() + lockoutTime)
      });
    } else {
      await user.update({
        login_attempts: newAttempts
      });
    }
  }

  /**
   * Verificar token JWT
   */
  static async verifyToken(token) {
    try {
      const decoded = AuthUtils.verifyToken(token);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user || !user.is_active) {
        throw new Error('Token inválido');
      }

      return user;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}

module.exports = AuthService;
