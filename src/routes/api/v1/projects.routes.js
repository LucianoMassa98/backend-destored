const express = require('express');
const router = express.Router();

// Importar middlewares y servicios
const { authenticateJWT } = require('../../../middlewares/auth.handler');
const { requireClient, requireUserRole } = require('../../../middlewares/roles.handler');
const { validateSchema, validatePagination, validateFilters, validateSorting } = require('../../../middlewares/validator.handler');
const ResponseUtils = require('../../../utils/responseUtils');

// Importar servicios
const ProjectService = require('../../../services/ProjectService');

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Gestión de proyectos
 */

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Obtener lista de proyectos
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, completed, cancelled]
 *       - in: query
 *         name: budget_min
 *         schema:
 *           type: number
 *       - in: query
 *         name: budget_max
 *         schema:
 *           type: number
 *       - in: query
 *         name: remote_work
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, budget_min, deadline, title]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Lista de proyectos
 */
router.get('/', 
  validatePagination,
  validateFilters(['category', 'status', 'budget_min', 'budget_max', 'remote_work', 'search']),
  validateSorting(['created_at', 'budget_min', 'deadline', 'title']),
  async (req, res, next) => {
    try {
      const result = await ProjectService.getPublicProjects(
        req.filters,
        req.pagination,
        req.sorting
      );
      ResponseUtils.paginated(res, result.projects, result.pagination, 'Proyectos obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/projects/available:
 *   get:
 *     summary: Obtener proyectos disponibles para aplicar
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Proyectos disponibles
 *       401:
 *         description: Token requerido
 */
router.get('/available',
  authenticateJWT,
  validatePagination,
  validateFilters(['category', 'budget_min', 'budget_max', 'remote_work']),
  validateSorting(['created_at', 'budget_min', 'deadline']),
  async (req, res, next) => {
    try {
      const result = await ProjectService.getAvailableProjects(
        req.user.id,
        req.filters,
        req.pagination,
        req.sorting
      );
      ResponseUtils.paginated(res, result.projects, result.pagination, 'Proyectos disponibles obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Crear nuevo proyecto
 *     tags: [Projects]
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
 *               - category
 *               - budget_type
 *               - budget_min
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 50
 *               category:
 *                 type: string
 *               budget_type:
 *                 type: string
 *                 enum: [fixed, hourly]
 *               budget_min:
 *                 type: number
 *                 minimum: 0
 *               budget_max:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *               required_skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Proyecto creado exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Solo clientes pueden crear proyectos
 */
router.post('/',
  authenticateJWT,
  requireClient,
  async (req, res, next) => {
    try {
      const project = await ProjectService.createProject(req.user.id, req.body);
      ResponseUtils.success(res, project, 'Proyecto creado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   get:
 *     summary: Obtener proyecto por ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalles del proyecto
 *       404:
 *         description: Proyecto no encontrado
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const project = await ProjectService.getProjectById(req.params.projectId);
    ResponseUtils.success(res, project, 'Proyecto obtenido exitosamente');
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return ResponseUtils.notFound(res, error.message);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   put:
 *     summary: Actualizar proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               budget_min:
 *                 type: number
 *               budget_max:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Proyecto actualizado exitosamente
 *       403:
 *         description: No tienes permisos para actualizar este proyecto
 *       404:
 *         description: Proyecto no encontrado
 */
router.put('/:projectId', authenticateJWT, async (req, res, next) => {
  try {
    const project = await ProjectService.updateProject(req.params.projectId, req.user.id, req.body);
    ResponseUtils.success(res, project, 'Proyecto actualizado exitosamente');
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return ResponseUtils.notFound(res, error.message);
    }
    if (error.message.includes('permisos')) {
      return ResponseUtils.forbidden(res, error.message);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/projects/{projectId}/apply:
 *   post:
 *     summary: Aplicar a un proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cover_letter
 *             properties:
 *               cover_letter:
 *                 type: string
 *                 minLength: 50
 *                 maxLength: 2000
 *               proposed_rate:
 *                 type: number
 *               proposed_timeline:
 *                 type: integer
 *               availability_start:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Aplicación enviada exitosamente
 *       400:
 *         description: Error de validación o ya aplicaste a este proyecto
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Solo profesionales pueden aplicar
 */
router.post('/:projectId/apply', authenticateJWT, async (req, res, next) => {
  try {
    // Verificar que el usuario sea profesional
    if (req.user.role !== 'professional') {
      return ResponseUtils.forbidden(res, 'Solo los profesionales pueden aplicar a proyectos');
    }

    const application = await ProjectService.applyToProject(
      req.params.projectId,
      req.user.id,
      req.body
    );
    ResponseUtils.success(res, application, 'Aplicación enviada exitosamente', 201);
  } catch (error) {
    if (error.message.includes('ya aplicaste') || error.message.includes('no puedes aplicar')) {
      return ResponseUtils.error(res, error.message, 400);
    }
    if (error.message.includes('no encontrado')) {
      return ResponseUtils.notFound(res, error.message);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/projects/{projectId}/applications:
 *   get:
 *     summary: Obtener aplicaciones de un proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Aplicaciones del proyecto
 *       403:
 *         description: No tienes acceso a este proyecto
 *       404:
 *         description: Proyecto no encontrado
 */
router.get('/:projectId/applications', authenticateJWT, async (req, res, next) => {
  try {
    const applications = await ProjectService.getProjectApplications(req.params.projectId, req.user.id);
    ResponseUtils.success(res, applications, 'Aplicaciones obtenidas exitosamente');
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return ResponseUtils.notFound(res, error.message);
    }
    if (error.message.includes('acceso')) {
      return ResponseUtils.forbidden(res, error.message);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/projects/my-projects:
 *   get:
 *     summary: Obtener proyectos del usuario autenticado
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proyectos del usuario
 *       401:
 *         description: Token requerido
 */
router.get('/my-projects', authenticateJWT, validatePagination, async (req, res, next) => {
  try {
    const result = await ProjectService.getUserProjects(
      req.user.id,
      req.user.role,
      req.query.status,
      req.pagination
    );
    ResponseUtils.paginated(res, result.projects, result.pagination, 'Proyectos obtenidos exitosamente');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
