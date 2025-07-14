const { Application, User, Professional, Project, Client } = require('../db/models');
const { Op } = require('sequelize');
const EmailService = require('./EmailService');
const NotificationService = require('./NotificationService');

class ApplicationService {
  /**
   * Obtener aplicaciones con filtros y paginación
   */
  static async getApplications(filters = {}, pagination = { page: 1, limit: 10 }, userRole, userId) {
    const whereClause = {};
    const includeClause = [
      {
        model: User,
        as: 'professional',
        attributes: ['id', 'first_name', 'last_name', 'avatar_url', 'email'],
        include: [
          {
            model: Professional,
            as: 'professionalProfile',
            attributes: ['title', 'experience_years', 'hourly_rate', 'completion_rate', 'bio']
          }
        ]
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'title', 'description', 'category', 'budget_min', 'budget_max', 'status', 'duration_estimate', 'created_at', 'deadline', 'required_skills', 'metadata'],
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'first_name', 'last_name', 'avatar_url', 'email'],
            include: [
              {
                model: Client,
                as: 'clientProfile',
                attributes: ['company_name'],
                required: false
              }
            ]
          }
        ]
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'first_name', 'last_name'],
        required: false
      }
    ];

    // Filtros según el rol del usuario
    if (userRole === 'professional') {
      // Los profesionales solo pueden ver sus propias aplicaciones
      // No permitir filtrar por otro professional_id
      whereClause.professional_id = userId;
    } else if (userRole === 'client') {
      // Solo aplicaciones de proyectos del cliente
      includeClause[1].where = { client_id: userId };
      includeClause[1].required = true;
    } else if (userRole === 'admin') {
      // Los administradores pueden ver todas las aplicaciones sin restricciones
    }

    // Filtros adicionales
    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.project_id) {
      whereClause.project_id = filters.project_id;
    }

    // Solo permitir filtrar por professional_id si no es un usuario professional
    // (admin y client pueden filtrar por professional_id)
    if (filters.professional_id && userRole !== 'professional') {
      whereClause.professional_id = filters.professional_id;
    }

    if (filters.date_from) {
      whereClause.created_at = {
        [Op.gte]: new Date(filters.date_from)
      };
    }

    if (filters.date_to) {
      whereClause.created_at = {
        ...whereClause.created_at,
        [Op.lte]: new Date(filters.date_to)
      };
    }

    // Filtro por rango de tarifa propuesta
    if (filters.rate_min) {
      whereClause.proposed_rate = {
        [Op.gte]: parseFloat(filters.rate_min)
      };
    }

    if (filters.rate_max) {
      whereClause.proposed_rate = {
        ...whereClause.proposed_rate,
        [Op.lte]: parseFloat(filters.rate_max)
      };
    }

    const offset = (pagination.page - 1) * pagination.limit;



    const { count, rows } = await Application.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: pagination.limit,
      offset: offset,
      order: [
        ['priority_score', 'DESC'],
        ['created_at', 'DESC']
      ],
      distinct: true
    });

    // Obtener conteo total de aplicaciones para metadatos
    const totalApplicationsCount = await Application.count({
      where: userRole === 'professional' ? { professional_id: userId } : 
             userRole === 'client' ? {} : {},
      include: userRole === 'client' ? [{
        model: Project,
        as: 'project',
        where: { client_id: userId },
        attributes: []
      }] : []
    });

    // Obtener estadísticas por estado
    const statusStats = await Application.findAll({
      where: userRole === 'professional' ? { professional_id: userId } : {},
      include: userRole === 'client' ? [{
        model: Project,
        as: 'project',
        where: { client_id: userId },
        attributes: []
      }] : [],
      attributes: [
        'status',
        [Application.sequelize.fn('COUNT', Application.sequelize.col('Application.id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Calcular tiempo promedio de respuesta
    const avgResponseTime = await Application.findOne({
      where: {
        ...whereClause,
        response_time_hours: { [Op.ne]: null }
      },
      include: userRole === 'client' ? [{
        model: Project,
        as: 'project',
        where: { client_id: userId },
        attributes: []
      }] : [],
      attributes: [
        [Application.sequelize.fn('AVG', Application.sequelize.col('response_time_hours')), 'avg_response_hours']
      ],
      raw: true
    });

    // Formatear aplicaciones según la estructura requerida
    const formattedApplications = await Promise.all(rows.map(async (app) => {
      // Obtener conteo de aplicaciones del proyecto
      const projectApplicationsCount = await Application.count({
        where: { project_id: app.project_id }
      });

      // Obtener skills requeridas del proyecto
      let requiredSkills = [];
      try {
        if (app.project.required_skills) {
          requiredSkills = app.project.required_skills;
        }
      } catch (error) {
        // Si hay error, continuar sin skills
      }

      return {
        // Información básica de la aplicación
        id: app.id,
        professional_id: app.professional_id,
        project_id: app.project_id,
        
        // Estado y evaluación
        status: app.status,
        priority_score: app.priority_score,
        
        // Propuesta del profesional
        proposed_rate: parseFloat(app.proposed_rate || 0),
        proposed_timeline: app.proposed_timeline,
        cover_letter: app.cover_letter,
        availability_start: app.availability_start,
        
        // Metadatos temporales
        created_at: app.created_at,
        updated_at: app.updated_at,
        
        // Información del proyecto relacionado
        project: {
          id: app.project.id,
          title: app.project.title,
          description: app.project.description,
          category: app.project.category,
          status: app.project.status,
          budget_min: parseFloat(app.project.budget_min || 0),
          budget_max: parseFloat(app.project.budget_max || 0),
          timeline_weeks: app.project.duration_estimate ? Math.ceil(app.project.duration_estimate / 7) : null, // Convertir días a semanas
          created_at: app.project.created_at,
          deadline: app.project.deadline,
          
          // Información del cliente
          client: {
            id: app.project.client.id,
            first_name: app.project.client.first_name,
            last_name: app.project.client.last_name,
            email: app.project.client.email,
            company_name: app.project.client.clientProfile?.company_name || null
          },
          
          // Habilidades requeridas
          required_skills: requiredSkills,
          
          // Metadatos adicionales del proyecto
          applications_count: projectApplicationsCount
        },
        
        // Información adicional de evaluación (si aplica)
        evaluation: app.priority_score && app.reviewed_by ? {
          rating: app.priority_score / 20, // Convertir score 0-100 a rating 0-5
          feedback: app.client_feedback,
          evaluated_at: app.reviewed_at,
          evaluated_by: app.reviewed_by
        } : null,
        
        // Información de aprobación/rechazo (si aplica)
        decision: app.status !== 'pending' && app.reviewed_by ? {
          reason: app.rejection_reason || app.client_feedback || null,
          decided_at: app.reviewed_at,
          decided_by: app.reviewed_by
        } : null
      };
    }));

    // Preparar estadísticas por estado
    const statusSummary = statusStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {
      pending: 0,
      under_review: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
      expired: 0
    });

    // Calcular tasa de éxito
    const totalEvaluated = statusSummary.accepted + statusSummary.rejected;
    const successRate = totalEvaluated > 0 ? statusSummary.accepted / totalEvaluated : 0;

    const totalPages = Math.ceil(count / pagination.limit);

    return {
      // Array principal de aplicaciones
      applications: formattedApplications,
      
      // Información de paginación
      pagination: {
        current_page: pagination.page,
        per_page: pagination.limit,
        total_pages: totalPages,
        total_count: count,
        has_next: pagination.page < totalPages,
        has_prev: pagination.page > 1
      },
      
      // Metadatos adicionales
      meta: {
        total_applications: totalApplicationsCount,
        status_summary: statusSummary,
        avg_response_time_hours: avgResponseTime?.avg_response_hours ? 
          parseFloat(avgResponseTime.avg_response_hours).toFixed(2) : null,
        success_rate: parseFloat(successRate.toFixed(2))
      }
    };
  }

  /**
   * Obtener una aplicación específica
   */
  static async getApplicationById(applicationId, userId, userRole) {
    const application = await Application.findByPk(applicationId, {
      include: [
        {
          model: User,
          as: 'professional',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url', 'email'],
          include: [
            {
              model: Professional,
              as: 'professionalProfile',
              attributes: ['title', 'experience_years', 'hourly_rate', 'completion_rate', 'bio']
            }
          ]
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'description', 'category', 'budget_min', 'budget_max', 'status', 'client_id'],
          include: [
            {
              model: User,
              as: 'client',
              attributes: ['id', 'first_name', 'last_name', 'avatar_url']
            }
          ]
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'first_name', 'last_name'],
          required: false
        }
      ]
    });

    if (!application) {
      throw new Error('Aplicación no encontrada');
    }

    // Verificar permisos de acceso
    const canAccess = this.canUserAccessApplication(application, userId, userRole);
    if (!canAccess) {
      throw new Error('No tienes permisos para ver esta aplicación');
    }

    return application;
  }

  /**
   * Evaluar aplicación (cambiar prioridad y agregar comentarios)
   */
  static async evaluateApplication(applicationId, evaluationData, evaluatorId) {
    const application = await this.getApplicationById(applicationId, evaluatorId, 'client');

    if (!application.canBeAccepted()) {
      throw new Error('Esta aplicación no puede ser evaluada en su estado actual');
    }

    const updateData = {
      priority_score: evaluationData.priority_score,
      status: 'under_review',
      reviewed_by: evaluatorId,
      reviewed_at: new Date()
    };

    if (evaluationData.client_feedback) {
      updateData.client_feedback = evaluationData.client_feedback;
    }

    if (evaluationData.metadata) {
      updateData.metadata = {
        ...application.metadata,
        ...evaluationData.metadata
      };
    }

    await application.update(updateData);

    // Notificar al profesional que su aplicación está siendo revisada
    try {
      await NotificationService.create({
        user_id: application.professional_id,
        type: 'application_under_review',
        title: 'Aplicación en revisión',
        message: `Tu aplicación para "${application.project.title}" está siendo revisada`,
        metadata: {
          application_id: applicationId,
          project_id: application.project_id
        }
      });
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }

    return application.reload({
      include: [
        {
          model: User,
          as: 'professional',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title']
        }
      ]
    });
  }

  /**
   * Aprobar aplicación
   */
  static async approveApplication(applicationId, approvalData, approverId) {
    const application = await this.getApplicationById(applicationId, approverId, 'client');

    if (!application.canBeAccepted()) {
      throw new Error('Esta aplicación no puede ser aprobada en su estado actual');
    }

    // Verificar que el usuario sea el cliente del proyecto
    if (application.project.client_id !== approverId) {
      throw new Error('Solo el cliente del proyecto puede aprobar aplicaciones');
    }

    const updateData = {
      status: 'accepted',
      reviewed_at: new Date(),
      reviewed_by: approverId
    };

    if (approvalData.client_feedback) {
      updateData.client_feedback = approvalData.client_feedback;
    }

    if (approvalData.final_rate && approvalData.final_rate !== application.proposed_rate) {
      updateData.metadata = {
        ...application.metadata,
        final_negotiated_rate: approvalData.final_rate,
        rate_negotiation_notes: approvalData.rate_negotiation_notes
      };
    }

    await application.update(updateData);

    // Asignar el proyecto al profesional
    await application.project.update({
      assigned_professional_id: application.professional_id,
      status: 'in_progress',
      final_amount: approvalData.final_rate || application.proposed_rate
    });

    // Rechazar automáticamente otras aplicaciones pendientes
    await this.rejectOtherApplications(
      application.project_id, 
      applicationId, 
      approverId,
      'Se seleccionó otro profesional para el proyecto'
    );

    // Enviar notificaciones
    try {
      // Notificar al profesional seleccionado
      await EmailService.sendProjectAssignedNotification(
        application.professional.email,
        application.professional.first_name,
        application.project.title,
        application.project.client.first_name
      );

      await NotificationService.create({
        user_id: application.professional_id,
        type: 'application_accepted',
        title: 'Aplicación aceptada',
        message: `¡Felicidades! Tu aplicación para "${application.project.title}" ha sido aceptada`,
        metadata: {
          application_id: applicationId,
          project_id: application.project_id
        }
      });
    } catch (error) {
      console.error('Error enviando notificaciones:', error);
    }

    return application.reload({
      include: [
        {
          model: User,
          as: 'professional',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status']
        }
      ]
    });
  }

  /**
   * Rechazar aplicación
   */
  static async rejectApplication(applicationId, rejectionData, rejectorId) {
    const application = await this.getApplicationById(applicationId, rejectorId, 'client');

    if (!['pending', 'under_review'].includes(application.status)) {
      throw new Error('Esta aplicación no puede ser rechazada en su estado actual');
    }

    // Verificar que el usuario sea el cliente del proyecto
    if (application.project.client_id !== rejectorId) {
      throw new Error('Solo el cliente del proyecto puede rechazar aplicaciones');
    }

    const updateData = {
      status: 'rejected',
      reviewed_at: new Date(),
      reviewed_by: rejectorId,
      rejection_reason: rejectionData.reason || 'No especificado'
    };

    if (rejectionData.client_feedback) {
      updateData.client_feedback = rejectionData.client_feedback;
    }

    await application.update(updateData);

    // Enviar notificación al profesional
    try {
      await NotificationService.create({
        user_id: application.professional_id,
        type: 'application_rejected',
        title: 'Aplicación rechazada',
        message: `Tu aplicación para "${application.project.title}" no fue seleccionada`,
        metadata: {
          application_id: applicationId,
          project_id: application.project_id,
          rejection_reason: rejectionData.reason
        }
      });

      // Opcionalmente enviar email con feedback constructivo
      if (rejectionData.send_feedback_email && rejectionData.client_feedback) {
        await EmailService.sendApplicationRejectionFeedback(
          application.professional.email,
          application.professional.first_name,
          application.project.title,
          rejectionData.client_feedback
        );
      }
    } catch (error) {
      console.error('Error enviando notificaciones:', error);
    }

    return application;
  }

  /**
   * Retirar aplicación (por parte del profesional)
   */
  static async withdrawApplication(applicationId, withdrawalData, professionalId) {
    const application = await this.getApplicationById(applicationId, professionalId, 'professional');

    if (!application.canBeWithdrawn()) {
      throw new Error('Esta aplicación no puede ser retirada en su estado actual');
    }

    // Verificar que el usuario sea el profesional que aplicó
    if (application.professional_id !== professionalId) {
      throw new Error('Solo puedes retirar tus propias aplicaciones');
    }

    await application.update({
      status: 'withdrawn',
      metadata: {
        ...application.metadata,
        withdrawal_reason: withdrawalData.reason || 'No especificado',
        withdrawn_at: new Date()
      }
    });

    // Notificar al cliente
    try {
      await NotificationService.create({
        user_id: application.project.client_id,
        type: 'application_withdrawn',
        title: 'Aplicación retirada',
        message: `${application.professional.first_name} ${application.professional.last_name} retiró su aplicación para "${application.project.title}"`,
        metadata: {
          application_id: applicationId,
          project_id: application.project_id
        }
      });
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }

    return application;
  }

  /**
   * Obtener estadísticas de aplicaciones
   */
  static async getApplicationStats(filters = {}, userId = null, userRole = null) {
    let whereClause = {};
    let includeClause = [];

    // Filtros según el rol del usuario
    if (userRole === 'professional' && userId) {
      whereClause.professional_id = userId;
    } else if (userRole === 'client' && userId) {
      includeClause.push({
        model: Project,
        as: 'project',
        where: { client_id: userId },
        attributes: []
      });
    }

    const stats = await Application.findAll({
      where: whereClause,
      include: includeClause,
      attributes: [
        'status',
        [Application.sequelize.fn('COUNT', Application.sequelize.col('Application.id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const totalApplications = await Application.count({
      where: whereClause,
      include: includeClause.length > 0 ? includeClause : undefined
    });

    // Calcular tiempo promedio de respuesta
    const avgResponseTime = await Application.findOne({
      where: {
        ...whereClause,
        response_time_hours: { [Op.ne]: null }
      },
      include: includeClause.length > 0 ? includeClause : undefined,
      attributes: [
        [Application.sequelize.fn('AVG', Application.sequelize.col('response_time_hours')), 'avg_response_hours']
      ],
      raw: true
    });

    return {
      total: totalApplications,
      by_status: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {}),
      avg_response_time_hours: avgResponseTime?.avg_response_hours ? 
        parseFloat(avgResponseTime.avg_response_hours).toFixed(2) : null
    };
  }

  /**
   * Métodos auxiliares
   */

  /**
   * Verificar si un usuario puede acceder a una aplicación
   */
  static canUserAccessApplication(application, userId, userRole) {
    // Administradores pueden ver todas
    if (userRole === 'admin') return true;
    
    // Profesionales solo pueden ver sus propias aplicaciones
    if (userRole === 'professional') {
      return application.professional_id === userId;
    }
    
    // Clientes solo pueden ver aplicaciones de sus proyectos
    if (userRole === 'client') {
      return application.project.client_id === userId;
    }
    
    return false;
  }

  /**
   * Rechazar otras aplicaciones cuando se acepta una
   */
  static async rejectOtherApplications(projectId, acceptedApplicationId, rejectorId, reason) {
    return await Application.update(
      {
        status: 'rejected',
        reviewed_at: new Date(),
        reviewed_by: rejectorId,
        rejection_reason: reason
      },
      {
        where: {
          project_id: projectId,
          id: { [Op.ne]: acceptedApplicationId },
          status: ['pending', 'under_review']
        }
      }
    );
  }

  /**
   * Calcular y actualizar prioridad de aplicación basada en algoritmo
   */
  static async calculatePriorityScore(applicationId) {
    const application = await Application.findByPk(applicationId, {
      include: [
        {
          model: User,
          as: 'professional',
          include: [
            {
              model: Professional,
              as: 'professionalProfile'
            }
          ]
        }
      ]
    });

    if (!application) return null;

    let score = 50; // Base score

    const professional = application.professional.professionalProfile;
    
    if (professional) {
      // Factor experiencia (0-20 puntos)
      score += Math.min(professional.experience_years * 2, 20);
      
      // Factor rating promedio (0-15 puntos)
      try {
        const averageRating = await professional.getAverageRating();
        if (averageRating) {
          score += (averageRating - 3) * 5; // 5 puntos por cada estrella sobre 3
        }
      } catch (error) {
        // Si hay error obteniendo el rating, continúa sin este factor
        console.warn('Error obteniendo rating promedio:', error.message);
      }
      
      // Factor tasa de completación (0-10 puntos)
      if (professional.completion_rate) {
        score += professional.completion_rate * 0.1;
      }
    }

    // Factor competitividad de tarifa (0-10 puntos)
    // Si la tarifa propuesta es menor al budget máximo, dar puntos adicionales
    if (application.project && application.proposed_rate && application.project.budget_max) {
      const rateRatio = application.proposed_rate / application.project.budget_max;
      if (rateRatio <= 0.8) score += 10;
      else if (rateRatio <= 0.9) score += 5;
    }

    // Factor tiempo de respuesta (-5 puntos por cada día de retraso)
    const daysOld = application.getDaysOld();
    if (daysOld > 1) {
      score -= (daysOld - 1) * 5;
    }

    // Asegurar que el score esté entre 0 y 100
    score = Math.max(0, Math.min(100, score));

    await application.update({ priority_score: score });
    
    return score;
  }
}

module.exports = ApplicationService;
