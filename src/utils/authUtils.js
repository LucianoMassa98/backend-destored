const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthUtils {
  /**
   * Hashear contraseña
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<string>} - Contraseña hasheada
   */
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Comparar contraseña
   * @param {string} password - Contraseña en texto plano
   * @param {string} hashedPassword - Contraseña hasheada
   * @returns {Promise<boolean>} - Resultado de la comparación
   */
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generar token JWT
   * @param {object} payload - Datos del usuario
   * @returns {string} - Token JWT
   */
  static generateToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  /**
   * Generar refresh token
   * @param {object} payload - Datos del usuario
   * @returns {string} - Refresh token
   */
  static generateRefreshToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Verificar token JWT
   * @param {string} token - Token a verificar
   * @returns {object} - Payload decodificado
   */
  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  /**
   * Verificar refresh token
   * @param {string} token - Refresh token a verificar
   * @returns {object} - Payload decodificado
   */
  static verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  }

  /**
   * Extraer token del header Authorization
   * @param {string} authHeader - Header de autorización
   * @returns {string|null} - Token extraído o null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

module.exports = AuthUtils;
