const { File, Project, Portfolio, User } = require('../db/models');
const { deleteFromCloudinary } = require('../middlewares/upload.handler');

class FileService {
  /**
   * Guardar archivo en la base de datos
   */
  static async saveFile(fileData) {
    const {
      filename,
      originalName,
      mimeType,
      sizeBytes,
      url,
      cloudinaryPublicId,
      fileType,
      uploadedBy,
      projectId,
      portfolioId,
      description
    } = fileData;

    // Verificar permisos si está asociado a un proyecto
    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }

      // Solo el cliente del proyecto o el profesional asignado pueden subir archivos
      if (project.client_id !== uploadedBy && project.assigned_professional_id !== uploadedBy) {
        throw new Error('No tienes permisos para subir archivos a este proyecto');
      }
    }

    // Verificar permisos si está asociado a un portafolio
    if (portfolioId) {
      const portfolio = await Portfolio.findByPk(portfolioId);
      if (!portfolio) {
        throw new Error('Portafolio no encontrado');
      }

      if (portfolio.user_id !== uploadedBy) {
        throw new Error('No tienes permisos para subir archivos a este portafolio');
      }
    }

    const file = await File.create({
      filename,
      original_name: originalName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      url,
      cloudinary_public_id: cloudinaryPublicId,
      file_type: fileType,
      uploaded_by: uploadedBy,
      project_id: projectId,
      portfolio_id: portfolioId,
      description
    });

    return file;
  }

  /**
   * Guardar múltiples archivos
   */
  static async saveMultipleFiles(filesData) {
    const savedFiles = [];

    for (const fileData of filesData) {
      const savedFile = await this.saveFile(fileData);
      savedFiles.push(savedFile);
    }

    return savedFiles;
  }

  /**
   * Obtener archivo por ID
   */
  static async getFileById(fileId, userId) {
    const file = await File.findByPk(fileId, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'client_id', 'assigned_professional_id']
        },
        {
          model: Portfolio,
          as: 'portfolio',
          attributes: ['id', 'title', 'user_id']
        }
      ]
    });

    if (!file) {
      throw new Error('Archivo no encontrado');
    }

    // Verificar permisos de acceso
    const hasAccess = this.checkFileAccess(file, userId);
    if (!hasAccess) {
      throw new Error('No tienes acceso a este archivo');
    }

    return file;
  }

  /**
   * Eliminar archivo
   */
  static async deleteFile(fileId, userId) {
    const file = await File.findByPk(fileId, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['client_id', 'assigned_professional_id']
        },
        {
          model: Portfolio,
          as: 'portfolio',
          attributes: ['user_id']
        }
      ]
    });

    if (!file) {
      throw new Error('Archivo no encontrado');
    }

    // Verificar permisos de eliminación
    const canDelete = this.checkDeletePermission(file, userId);
    if (!canDelete) {
      throw new Error('No tienes permisos para eliminar este archivo');
    }

    // Eliminar de Cloudinary
    if (file.cloudinary_public_id) {
      try {
        await deleteFromCloudinary(file.cloudinary_public_id);
      } catch (error) {
        // Log el error pero continúa con la eliminación de la base de datos
        console.error('Error eliminando archivo de Cloudinary:', error);
      }
    }

    // Eliminar de la base de datos
    await file.destroy();

    return {
      message: 'Archivo eliminado exitosamente'
    };
  }

  /**
   * Obtener archivos de un proyecto
   */
  static async getProjectFiles(projectId, userId) {
    // Verificar acceso al proyecto
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    if (project.client_id !== userId && project.assigned_professional_id !== userId) {
      throw new Error('No tienes acceso a este proyecto');
    }

    const files = await File.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return files;
  }

  /**
   * Obtener archivos de un usuario
   */
  static async getUserFiles(targetUserId, requestUserId) {
    // Solo el propio usuario o administradores pueden ver archivos privados
    if (targetUserId !== requestUserId) {
      const requestUser = await User.findByPk(requestUserId);
      if (!['admin', 'super_admin'].includes(requestUser?.role)) {
        throw new Error('No tienes permisos para ver estos archivos');
      }
    }

    const files = await File.findAll({
      where: { uploaded_by: targetUserId },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title']
        },
        {
          model: Portfolio,
          as: 'portfolio',
          attributes: ['id', 'title']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return files;
  }

  /**
   * Obtener archivos de portafolio
   */
  static async getPortfolioFiles(portfolioId, userId) {
    const portfolio = await Portfolio.findByPk(portfolioId);
    if (!portfolio) {
      throw new Error('Portafolio no encontrado');
    }

    // Los archivos de portafolio son públicos, pero verificamos que el portafolio exista
    const files = await File.findAll({
      where: { portfolio_id: portfolioId },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return files;
  }

  /**
   * Verificar acceso a archivo
   */
  static checkFileAccess(file, userId) {
    // El uploader siempre tiene acceso
    if (file.uploaded_by === userId) {
      return true;
    }

    // Si está asociado a un proyecto
    if (file.project) {
      return file.project.client_id === userId || 
             file.project.assigned_professional_id === userId;
    }

    // Si está asociado a un portafolio (generalmente público)
    if (file.portfolio) {
      return true; // Los archivos de portafolio son públicos
    }

    // Por defecto, no hay acceso
    return false;
  }

  /**
   * Verificar permisos de eliminación
   */
  static checkDeletePermission(file, userId) {
    // El uploader puede eliminar
    if (file.uploaded_by === userId) {
      return true;
    }

    // Si está en un proyecto, el cliente puede eliminar
    if (file.project && file.project.client_id === userId) {
      return true;
    }

    // Si está en un portafolio, solo el dueño puede eliminar
    if (file.portfolio && file.portfolio.user_id === userId) {
      return true;
    }

    return false;
  }

  /**
   * Obtener estadísticas de archivos
   */
  static async getFileStats(userId = null) {
    const whereClause = userId ? { uploaded_by: userId } : {};

    const totalFiles = await File.count({ where: whereClause });
    
    const filesByType = await File.findAll({
      where: whereClause,
      attributes: [
        'file_type',
        [File.sequelize.fn('COUNT', File.sequelize.col('id')), 'count'],
        [File.sequelize.fn('SUM', File.sequelize.col('size_bytes')), 'total_size']
      ],
      group: ['file_type'],
      raw: true
    });

    const totalSize = await File.sum('size_bytes', { where: whereClause });

    return {
      totalFiles,
      totalSize: totalSize || 0,
      filesByType: filesByType.reduce((acc, item) => {
        acc[item.file_type] = {
          count: parseInt(item.count),
          totalSize: parseInt(item.total_size || 0)
        };
        return acc;
      }, {})
    };
  }
}

module.exports = FileService;
