const { User, Professional, Client, Admin } = require('../db/models');
const { Op } = require('sequelize');

class UserService {
  /**
   * Obtener perfil completo del usuario
   */
  static async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Professional,
          as: 'professionalProfile',
          required: false
        },
        {
          model: Client,
          as: 'clientProfile',
          required: false
        },
        {
          model: Admin,
          as: 'adminProfile',
          required: false
        }
      ]
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Actualizar perfil del usuario
   */
  static async updateProfile(userId, updateData) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Campos permitidos para actualizar
    const allowedFields = [
      'first_name',
      'last_name', 
      'phone',
      'avatar_url',
      'preferences'
    ];

    const updateFields = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        // Convertir camelCase a snake_case para algunos campos
        const dbField = field === 'firstName' ? 'first_name' :
                       field === 'lastName' ? 'last_name' :
                       field === 'avatarUrl' ? 'avatar_url' :
                       field;
        updateFields[dbField] = updateData[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    await user.update(updateFields);

    // Retornar usuario actualizado con perfil específico
    return await this.getProfile(userId);
  }

  /**
   * Obtener usuario por ID (con verificaciones de permisos)
   */
  static async getUserById(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Professional,
          as: 'professionalProfile',
          required: false
        },
        {
          model: Client,
          as: 'clientProfile',
          required: false
        }
      ]
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Obtener lista de usuarios con filtros y paginación
   */
  static async getUsers(filters, pagination) {
    const whereClause = {};
    const includeClause = [];

    // Aplicar filtros
    if (filters.role) {
      whereClause.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      whereClause.is_active = filters.isActive === 'true';
    }

    if (filters.isVerified !== undefined) {
      whereClause.is_verified = filters.isVerified === 'true';
    }

    if (filters.search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${filters.search}%` } },
        { last_name: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    // Incluir perfiles específicos
    includeClause.push(
      {
        model: Professional,
        as: 'professionalProfile',
        required: false,
        attributes: ['title', 'experience_years', 'hourly_rate', 'is_verified']
      },
      {
        model: Client,
        as: 'clientProfile',
        required: false,
        attributes: ['company_name', 'total_spent', 'projects_count']
      }
    );

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: includeClause,
      attributes: { exclude: ['password', 'verification_token', 'reset_password_token'] },
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / pagination.limit);

    return {
      users: rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalItems: count,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPrevPage: pagination.page > 1
      }
    };
  }

  /**
   * Activar usuario
   */
  static async activateUser(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.is_active) {
      throw new Error('El usuario ya está activo');
    }

    await user.update({ is_active: true });

    return {
      message: 'Usuario activado exitosamente'
    };
  }

  /**
   * Desactivar usuario
   */
  static async deactivateUser(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.is_active) {
      throw new Error('El usuario ya está desactivado');
    }

    // No permitir desactivar super administradores
    if (user.role === 'super_admin') {
      throw new Error('No se puede desactivar un super administrador');
    }

    await user.update({ is_active: false });

    return {
      message: 'Usuario desactivado exitosamente'
    };
  }

  /**
   * Eliminar usuario (soft delete)
   */
  static async deleteUser(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // No permitir eliminar super administradores
    if (user.role === 'super_admin') {
      throw new Error('No se puede eliminar un super administrador');
    }

    await user.destroy();

    return {
      message: 'Usuario eliminado exitosamente'
    };
  }

  /**
   * Obtener estadísticas de usuarios
   */
  static async getUserStats() {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const verifiedUsers = await User.count({ where: { is_verified: true } });

    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    const usersByMonth = await User.findAll({
      attributes: [
        [User.sequelize.fn('DATE_TRUNC', 'month', User.sequelize.col('created_at')), 'month'],
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12))
        }
      },
      group: [User.sequelize.fn('DATE_TRUNC', 'month', User.sequelize.col('created_at'))],
      order: [[User.sequelize.fn('DATE_TRUNC', 'month', User.sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    const recentUsers = await User.findAll({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
        }
      },
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    return {
      overview: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        inactiveUsers: totalUsers - activeUsers,
        unverifiedUsers: totalUsers - verifiedUsers
      },
      byRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = parseInt(item.count);
        return acc;
      }, {}),
      growthByMonth: usersByMonth,
      recentUsers
    };
  }

  /**
   * Buscar usuarios públicos (para mostrar profesionales, etc.)
   */
  static async searchPublicUsers(query, filters = {}, pagination = {}) {
    const whereClause = {
      is_active: true,
      is_verified: true
    };

    if (filters.role) {
      whereClause.role = filters.role;
    }

    if (query) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${query}%` } },
        { last_name: { [Op.iLike]: `%${query}%` } }
      ];
    }

    const includeClause = [];
    
    if (filters.role === 'professional' || !filters.role) {
      includeClause.push({
        model: Professional,
        as: 'professionalProfile',
        required: filters.role === 'professional',
        where: filters.role === 'professional' ? { is_verified: true, is_available: true } : undefined
      });
    }

    const users = await User.findAll({
      where: whereClause,
      include: includeClause,
      attributes: ['id', 'first_name', 'last_name', 'avatar_url', 'role', 'created_at'],
      limit: pagination.limit || 20,
      offset: pagination.offset || 0,
      order: [['created_at', 'DESC']]
    });

    return users;
  }

  /**
   * Actualizar última actividad del usuario
   */
  static async updateLastActivity(userId) {
    await User.update(
      { 
        metadata: {
          lastActivity: new Date()
        }
      },
      { where: { id: userId } }
    );
  }
}

module.exports = UserService;
