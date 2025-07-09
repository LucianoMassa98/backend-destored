const express = require('express');
const router = express.Router();

// Importar middlewares y servicios
const { authenticateJWT } = require('../../../middlewares/auth.handler');
const { uploadSingle, uploadMultiple, processFiles } = require('../../../middlewares/upload.handler');
const ResponseUtils = require('../../../utils/responseUtils');

// Importar servicios
const FileService = require('../../../services/FileService');

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: Gestión de archivos
 */

/**
 * @swagger
 * /api/v1/files/upload:
 *   post:
 *     summary: Subir un archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               portfolioId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Archivo subido exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: Token requerido
 */
router.post('/upload', 
  authenticateJWT, 
  uploadSingle('file'), 
  processFiles,
  async (req, res, next) => {
    try {
      if (!req.uploadedFile) {
        return ResponseUtils.error(res, 'No se encontró archivo para subir', 400);
      }

      const fileData = {
        ...req.uploadedFile,
        uploadedBy: req.user.id,
        projectId: req.body.projectId,
        portfolioId: req.body.portfolioId,
        description: req.body.description
      };

      const savedFile = await FileService.saveFile(fileData);
      ResponseUtils.success(res, savedFile, 'Archivo subido exitosamente');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/files/upload-multiple:
 *   post:
 *     summary: Subir múltiples archivos
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               portfolioId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Archivos subidos exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: Token requerido
 */
router.post('/upload-multiple',
  authenticateJWT,
  uploadMultiple('files', 5),
  processFiles,
  async (req, res, next) => {
    try {
      if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
        return ResponseUtils.error(res, 'No se encontraron archivos para subir', 400);
      }

      const filesData = req.uploadedFiles.map(file => ({
        ...file,
        uploadedBy: req.user.id,
        projectId: req.body.projectId,
        portfolioId: req.body.portfolioId
      }));

      const savedFiles = await FileService.saveMultipleFiles(filesData);
      ResponseUtils.success(res, savedFiles, 'Archivos subidos exitosamente');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/files/{fileId}:
 *   get:
 *     summary: Obtener información de un archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Información del archivo
 *       404:
 *         description: Archivo no encontrado
 */
router.get('/:fileId', authenticateJWT, async (req, res, next) => {
  try {
    const file = await FileService.getFileById(req.params.fileId, req.user.id);
    ResponseUtils.success(res, file, 'Archivo obtenido exitosamente');
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
 * /api/v1/files/{fileId}:
 *   delete:
 *     summary: Eliminar un archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Archivo eliminado exitosamente
 *       403:
 *         description: No tienes permisos para eliminar este archivo
 *       404:
 *         description: Archivo no encontrado
 */
router.delete('/:fileId', authenticateJWT, async (req, res, next) => {
  try {
    const result = await FileService.deleteFile(req.params.fileId, req.user.id);
    ResponseUtils.success(res, null, result.message);
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
 * /api/v1/files/project/{projectId}:
 *   get:
 *     summary: Obtener archivos de un proyecto
 *     tags: [Files]
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
 *         description: Archivos del proyecto
 *       403:
 *         description: No tienes acceso a este proyecto
 */
router.get('/project/:projectId', authenticateJWT, async (req, res, next) => {
  try {
    const files = await FileService.getProjectFiles(req.params.projectId, req.user.id);
    ResponseUtils.success(res, files, 'Archivos del proyecto obtenidos exitosamente');
  } catch (error) {
    if (error.message.includes('acceso')) {
      return ResponseUtils.forbidden(res, error.message);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/files/user/{userId}:
 *   get:
 *     summary: Obtener archivos de un usuario
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Archivos del usuario
 *       403:
 *         description: No tienes permisos para ver estos archivos
 */
router.get('/user/:userId', authenticateJWT, async (req, res, next) => {
  try {
    const files = await FileService.getUserFiles(req.params.userId, req.user.id);
    ResponseUtils.success(res, files, 'Archivos del usuario obtenidos exitosamente');
  } catch (error) {
    if (error.message.includes('permisos')) {
      return ResponseUtils.forbidden(res, error.message);
    }
    next(error);
  }
});

module.exports = router;
