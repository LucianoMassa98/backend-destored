const { Project, Application, User, Professional, Client } = require('../db/models');
const { Op } = require('sequelize');
const EmailService = require('./EmailService');

class ProjectService {
  /**
   * Obtener proyectos públicos con filtros
   */
  static async getPublicProjects(filters, pagination, sorting) {
    const whereClause = {
      status: 'open',
      visibility: 'public'
    };

    // Aplicar filtros
    if (filters.category) {
      whereClause.category = filters.category;
    }

    if (filters.budget_min) {
      whereClause.budget_min = {
        [Op.gte]: parseFloat(filters.budget_min)
      };
    }

    if (filters.budget_max) {
      whereClause.budget_max = {
        [Op.lte]: parseFloat(filters.budget_max)
      };
    }

    if (filters.remote_work !== undefined) {
      whereClause.remote_work = filters.remote_work === 'true';
    }

    if (filters.search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const { count, rows } = await Project.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
          include: [
            {
              model: Client,
              as: 'clientProfile',
              attributes: ['company_name', 'projects_count']
            }
          ]
        }
      ],
      limit: pagination.limit,
      offset: pagination.offset,
      order: [[sorting.field, sorting.order]]
    });

    const totalPages = Math.ceil(count / pagination.limit);

    return {
      projects: rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalItems: count,
        totalPages
      }
    };
  }

  /**
   * Obtener proyectos disponibles para un profesional
   */
  static async getAvailableProjects(professionalId, filters, pagination, sorting) {
    // Obtener IDs de proyectos a los que ya aplicó
    const existingApplications = await Application.findAll({
      where: { professional_id: professionalId },
      attributes: ['project_id']
    });

    const appliedProjectIds = existingApplications.map(app => app.project_id);

    const whereClause = {
      status: 'open',
      visibility: 'public',
      application_deadline: {
        [Op.gt]: new Date()
      }
    };

    // Excluir proyectos a los que ya aplicó
    if (appliedProjectIds.length > 0) {
      whereClause.id = {
        [Op.notIn]: appliedProjectIds
      };
    }

    // Aplicar filtros adicionales
    if (filters.category) {
      whereClause.category = filters.category;
    }

    if (filters.budget_min) {
      whereClause.budget_min = { [Op.gte]: parseFloat(filters.budget_min) };
    }

    if (filters.budget_max) {
      whereClause.budget_max = { [Op.lte]: parseFloat(filters.budget_max) };
    }

    if (filters.remote_work !== undefined) {
      whereClause.remote_work = filters.remote_work === 'true';
    }

    const { count, rows } = await Project.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url']
        }
      ],
      limit: pagination.limit,
      offset: pagination.offset,
      order: [[sorting.field, sorting.order]]
    });

    const totalPages = Math.ceil(count / pagination.limit);

    return {
      projects: rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalItems: count,
        totalPages
      }
    };
  }

  /**
   * Crear nuevo proyecto
   */
  static async createProject(clientId, projectData) {
    const {
      title,
      description,
      category,
      subcategory,
      budget_type,
      budget_min,
      budget_max,
      duration_estimate,
      deadline,
      priority,
      required_skills,
      preferred_experience,
      remote_work,
      location,
      timezone_preference,
      application_deadline,
      milestones,
      requirements,
      deliverables,
      communication_preferences,
      visibility
    } = projectData;

    const project = await Project.create({
      client_id: clientId,
      title,
      description,
      category,
      subcategory,
      budget_type,
      budget_min,
      budget_max,
      duration_estimate,
      deadline,
      priority: priority || 'medium',
      required_skills: required_skills || [],
      preferred_experience,
      remote_work: remote_work !== undefined ? remote_work : true,
      location,
      timezone_preference,
      application_deadline,
      milestones: milestones || [],
      requirements: requirements || {},
      deliverables: deliverables || [],
      communication_preferences: communication_preferences || {},
      visibility: visibility || 'public',
      status: 'open'
    });

    // Incluir información del cliente en la respuesta
    const projectWithClient = await Project.findByPk(project.id, {
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url']
        }
      ]
    });

    return projectWithClient;
  }

  /**
   * Obtener proyecto por ID
   */
  static async getProjectById(projectId) {
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
          include: [
            {
              model: Client,
              as: 'clientProfile',
              attributes: ['company_name', 'projects_count', 'total_spent']
            }
          ]
        },
        {
          model: User,
          as: 'assignedProfessional',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
          required: false,
          include: [
            {
              model: Professional,
              as: 'professionalProfile',
              attributes: ['title', 'hourly_rate', 'experience_years']
            }
          ]
        }
      ]
    });

    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    // Incrementar contador de vistas
    await project.increment('view_count');

    return project;
  }

  /**
   * Actualizar proyecto
   */
  static async updateProject(projectId, userId, updateData) {
    const project = await Project.findByPk(projectId);

    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    // Solo el cliente propietario puede actualizar
    if (project.client_id !== userId) {
      throw new Error('No tienes permisos para actualizar este proyecto');
    }

    // Solo se puede actualizar si está en estado draft u open
    if (!['draft', 'open'].includes(project.status)) {
      throw new Error('No se puede modificar un proyecto en progreso o completado');
    }

    // Campos permitidos para actualizar
    const allowedFields = [
      'title', 'description', 'budget_min', 'budget_max', 
      'deadline', 'application_deadline', 'priority',
      'required_skills', 'deliverables', 'requirements'
    ];

    const updateFields = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    }

    await project.update(updateFields);

    return await this.getProjectById(projectId);
  }

  /**
   * Aplicar a un proyecto
   */
  static async applyToProject(projectId, professionalId, applicationData) {
    const project = await Project.findByPk(projectId);

    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    // Verificar que el proyecto esté abierto
    if (project.status !== 'open') {
      throw new Error('Este proyecto ya no está abierto para aplicaciones');
    }

    // Verificar deadline de aplicación
    if (project.application_deadline && new Date() > new Date(project.application_deadline)) {
      throw new Error('El plazo para aplicar a este proyecto ha expirado');
    }

    // Verificar que no haya aplicado antes
    const existingApplication = await Application.findOne({
      where: {
        project_id: projectId,
        professional_id: professionalId
      }
    });

    if (existingApplication) {
      throw new Error('Ya has aplicado a este proyecto');
    }

    // No puede aplicar a su propio proyecto
    if (project.client_id === professionalId) {
      throw new Error('No puedes aplicar a tu propio proyecto');
    }

    // Crear aplicación
    const application = await Application.create({
      project_id: projectId,
      professional_id: professionalId,
      cover_letter: applicationData.cover_letter,
      proposed_rate: applicationData.proposed_rate,
      proposed_timeline: applicationData.proposed_timeline,
      availability_start: applicationData.availability_start,
      relevant_experience: applicationData.relevant_experience,
      questions_responses: applicationData.questions_responses || {},
      portfolio_items: applicationData.portfolio_items || []
    });

    // Incrementar contador de aplicaciones del proyecto
    await project.increment('application_count');

    // Enviar notificación al cliente
    const professional = await User.findByPk(professionalId);
    const client = await User.findByPk(project.client_id);

    try {
      await EmailService.sendNewApplicationNotification(
        client.email,
        client.first_name,
        project.title,
        professional.getFullName()
      );
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }

    return application;
  }

  /**
   * Obtener aplicaciones de un proyecto
   */
  static async getProjectApplications(projectId, userId) {
    const project = await Project.findByPk(projectId);

    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    // Solo el cliente del proyecto puede ver las aplicaciones
    if (project.client_id !== userId) {
      throw new Error('No tienes acceso a las aplicaciones de este proyecto');
    }

    const applications = await Application.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          as: 'professional',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
          include: [
            {
              model: Professional,
              as: 'professionalProfile',
              attributes: ['title', 'experience_years', 'hourly_rate', 'completion_rate']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return applications;
  }

  /**
   * Obtener proyectos del usuario
   */
  static async getUserProjects(userId, userRole, status, pagination) {
    let whereClause = {};
    let includeClause = [];

    if (userRole === 'client') {
      whereClause.client_id = userId;
    } else if (userRole === 'professional') {
      whereClause.assigned_professional_id = userId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Incluir información relevante según el rol
    if (userRole === 'client') {
      includeClause.push({
        model: User,
        as: 'assignedProfessional',
        required: false,
        attributes: ['id', 'first_name', 'last_name', 'avatar_url']
      });
    } else {
      includeClause.push({
        model: User,
        as: 'client',
        attributes: ['id', 'first_name', 'last_name', 'avatar_url']
      });
    }

    const { count, rows } = await Project.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / pagination.limit);

    return {
      projects: rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalItems: count,
        totalPages
      }
    };
  }

  /**
   * Asignar proyecto a profesional
   */
  static async assignProject(projectId, applicationId, clientId) {
    const project = await Project.findByPk(projectId);
    
    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    if (project.client_id !== clientId) {
      throw new Error('No tienes permisos para asignar este proyecto');
    }

    const application = await Application.findByPk(applicationId, {
      include: [
        {
          model: User,
          as: 'professional',
          attributes: ['id', 'email', 'first_name', 'last_name']
        }
      ]
    });

    if (!application || application.project_id !== projectId) {
      throw new Error('Aplicación no encontrada');
    }

    // Actualizar proyecto
    await project.update({
      assigned_professional_id: application.professional_id,
      status: 'in_progress',
      final_amount: application.proposed_rate
    });

    // Actualizar aplicación
    await application.update({
      status: 'accepted',
      reviewed_at: new Date(),
      reviewed_by: clientId
    });

    // Rechazar otras aplicaciones
    await Application.update(
      {
        status: 'rejected',
        reviewed_at: new Date(),
        reviewed_by: clientId,
        rejection_reason: 'Se seleccionó otro profesional'
      },
      {
        where: {
          project_id: projectId,
          id: { [Op.ne]: applicationId },
          status: 'pending'
        }
      }
    );

    // Enviar notificación al profesional seleccionado
    try {
      await EmailService.sendProjectAssignedNotification(
        application.professional.email,
        application.professional.first_name,
        project.title,
        project.client.first_name
      );
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }

    return project;
  }

  /**
   * Evaluar aplicación de proyecto
   */
  static async evaluateProjectApplication(projectId, applicationId, evaluationData, clientId) {
    const ApplicationService = require('./ApplicationService');
    
    const application = await ApplicationService.getApplicationById(applicationId, clientId, 'client');
    
    if (application.project_id !== projectId) {
      throw new Error('La aplicación no pertenece a este proyecto');
    }

    return await ApplicationService.evaluateApplication(applicationId, evaluationData, clientId);
  }

  /**
   * Aprobar aplicación de proyecto
   */
  static async approveProjectApplication(projectId, applicationId, approvalData, clientId) {
    const ApplicationService = require('./ApplicationService');
    
    const application = await ApplicationService.getApplicationById(applicationId, clientId, 'client');
    
    if (application.project_id !== projectId) {
      throw new Error('La aplicación no pertenece a este proyecto');
    }

    return await ApplicationService.approveApplication(applicationId, approvalData, clientId);
  }

  /**
   * Rechazar aplicación de proyecto
   */
  static async rejectProjectApplication(projectId, applicationId, rejectionData, clientId) {
    const ApplicationService = require('./ApplicationService');
    
    const application = await ApplicationService.getApplicationById(applicationId, clientId, 'client');
    
    if (application.project_id !== projectId) {
      throw new Error('La aplicación no pertenece a este proyecto');
    }

    return await ApplicationService.rejectApplication(applicationId, rejectionData, clientId);
  }
}

module.exports = ProjectService;
