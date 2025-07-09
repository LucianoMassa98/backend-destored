const express = require('express');
const router = express.Router();
const ProfessionalService = require('../../../services/ProfessionalService');
const { authenticateJWT } = require('../../../middlewares/auth.handler');
const { requireRole } = require('../../../middlewares/roles.handler');
const { validateSchema } = require('../../../middlewares/validator.handler');
const {
  updateProfileSchema,
  searchProfessionalsSchema,
  addSkillSchema,
  updateSkillSchema,
  addPortfolioSchema,
  updatePortfolioSchema,
  addServiceSchema,
  updateServiceSchema,
  addCertificationSchema,
  updateCertificationSchema
} = require('../../../schemas/professional.schema');
const { successResponse, errorResponse } = require('../../../utils/responseUtils');

/**
 * @swagger
 * tags:
 *   name: Professionals
 *   description: Gestión de profesionales
 */

/**
 * @swagger
 * /api/v1/professionals/search:
 *   get:
 *     summary: Buscar profesionales con filtros
 *     tags: [Professionals]
 *     parameters:
 *       - in: query
 *         name: skills
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Habilidades a filtrar
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [desarrollo, diseño, marketing, escritura, traduccion, video, musica, consultoria, otro]
 *         description: Categoría del profesional
 *       - in: query
 *         name: experience
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Años mínimos de experiencia
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Ubicación del profesional
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         description: Rating mínimo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista de profesionales encontrados
 *       400:
 *         description: Parámetros de búsqueda inválidos
 */
router.get('/search',
  validateSchema(searchProfessionalsSchema, 'query'),
  async (req, res) => {
    try {
      const result = await ProfessionalService.searchProfessionals(req.query);
      successResponse(res, result, 'Profesionales encontrados exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/professionals/profile:
 *   get:
 *     summary: Obtener perfil del profesional autenticado
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del profesional obtenido exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Perfil no encontrado
 */
router.get('/profile',
  authenticateJWT,
  requireRole(['professional']),
  async (req, res) => {
    try {
      const profile = await ProfessionalService.getProfile(req.user.id);
      successResponse(res, profile, 'Perfil obtenido exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }
);

/**
 * @swagger
 * /api/v1/professionals/profile:
 *   put:
 *     summary: Actualizar perfil del profesional
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               category:
 *                 type: string
 *                 enum: [desarrollo, diseño, marketing, escritura, traduccion, video, musica, consultoria, otro]
 *               experienceYears:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 50
 *               hourlyRate:
 *                 type: number
 *                 minimum: 0
 *               location:
 *                 type: string
 *                 maxLength: 100
 *               timezone:
 *                 type: string
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.put('/profile',
  authenticateJWT,
  requireRole(['professional']),
  validateSchema(updateProfileSchema),
  async (req, res) => {
    try {
      const updatedProfile = await ProfessionalService.updateProfile(req.user.id, req.body);
      successResponse(res, updatedProfile, 'Perfil actualizado exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/professionals/{id}:
 *   get:
 *     summary: Obtener perfil público de un profesional
 *     tags: [Professionals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del profesional
 *     responses:
 *       200:
 *         description: Perfil del profesional obtenido exitosamente
 *       404:
 *         description: Profesional no encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const profile = await ProfessionalService.getProfile(req.params.id);
    successResponse(res, profile, 'Perfil obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
});

/**
 * @swagger
 * /api/v1/professionals/skills:
 *   post:
 *     summary: Agregar habilidad al perfil
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - level
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *               level:
 *                 type: string
 *                 enum: [principiante, intermedio, avanzado, experto]
 *               category:
 *                 type: string
 *               yearsOfExperience:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Habilidad agregada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/skills',
  authenticateJWT,
  requireRole(['professional']),
  validateSchema(addSkillSchema),
  async (req, res) => {
    try {
      const skill = await ProfessionalService.addSkill(req.user.id, req.body);
      successResponse(res, skill, 'Habilidad agregada exitosamente', 201);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/professionals/skills/{skillId}:
 *   put:
 *     summary: Actualizar habilidad
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [principiante, intermedio, avanzado, experto]
 *               category:
 *                 type: string
 *               yearsOfExperience:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Habilidad actualizada exitosamente
 *       404:
 *         description: Habilidad no encontrada
 */
router.put('/skills/:skillId',
  authenticateJWT,
  requireRole(['professional']),
  validateSchema(updateSkillSchema),
  async (req, res) => {
    try {
      const skill = await ProfessionalService.updateSkill(req.user.id, req.params.skillId, req.body);
      successResponse(res, skill, 'Habilidad actualizada exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }
);

/**
 * @swagger
 * /api/v1/professionals/skills/{skillId}:
 *   delete:
 *     summary: Eliminar habilidad
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Habilidad eliminada exitosamente
 *       404:
 *         description: Habilidad no encontrada
 */
router.delete('/skills/:skillId',
  authenticateJWT,
  requireRole(['professional']),
  async (req, res) => {
    try {
      const result = await ProfessionalService.removeSkill(req.user.id, req.params.skillId);
      successResponse(res, result, 'Habilidad eliminada exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }
);

/**
 * @swagger
 * /api/v1/professionals/portfolio:
 *   post:
 *     summary: Agregar proyecto al portafolio
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               projectUrl:
 *                 type: string
 *               technologies:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proyecto agregado al portafolio exitosamente
 */
router.post('/portfolio',
  authenticateJWT,
  requireRole(['professional']),
  validateSchema(addPortfolioSchema),
  async (req, res) => {
    try {
      const portfolio = await ProfessionalService.addPortfolioProject(req.user.id, req.body);
      successResponse(res, portfolio, 'Proyecto agregado al portafolio exitosamente', 201);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/professionals/portfolio/{portfolioId}:
 *   put:
 *     summary: Actualizar proyecto del portafolio
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: portfolioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proyecto del portafolio actualizado exitosamente
 */
router.put('/portfolio/:portfolioId',
  authenticateJWT,
  requireRole(['professional']),
  validateSchema(updatePortfolioSchema),
  async (req, res) => {
    try {
      const portfolio = await ProfessionalService.updatePortfolioProject(req.user.id, req.params.portfolioId, req.body);
      successResponse(res, portfolio, 'Proyecto del portafolio actualizado exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }
);

/**
 * @swagger
 * /api/v1/professionals/portfolio/{portfolioId}:
 *   delete:
 *     summary: Eliminar proyecto del portafolio
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: portfolioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proyecto eliminado del portafolio exitosamente
 */
router.delete('/portfolio/:portfolioId',
  authenticateJWT,
  requireRole(['professional']),
  async (req, res) => {
    try {
      const result = await ProfessionalService.removePortfolioProject(req.user.id, req.params.portfolioId);
      successResponse(res, result, 'Proyecto eliminado del portafolio exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }
);

/**
 * @swagger
 * /api/v1/professionals/projects:
 *   get:
 *     summary: Obtener proyectos asignados al profesional
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Filtrar por estado del proyecto
 *     responses:
 *       200:
 *         description: Proyectos asignados obtenidos exitosamente
 */
router.get('/projects',
  authenticateJWT,
  requireRole(['professional']),
  async (req, res) => {
    try {
      const projects = await ProfessionalService.getAssignedProjects(req.user.id, req.query.status);
      successResponse(res, projects, 'Proyectos asignados obtenidos exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/professionals/availability:
 *   patch:
 *     summary: Cambiar disponibilidad del profesional
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Disponibilidad cambiada exitosamente
 */
router.patch('/availability',
  authenticateJWT,
  requireRole(['professional']),
  async (req, res) => {
    try {
      const result = await ProfessionalService.toggleAvailability(req.user.id);
      successResponse(res, result, result.message);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

module.exports = router;
