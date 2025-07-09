const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const ResponseUtils = require('../utils/responseUtils');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de almacenamiento en memoria para Multer
const storage = multer.memoryStorage();

// Función para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || 
    ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Tipos válidos: ${allowedTypes.join(', ')}`), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB por defecto
    files: 5 // Máximo 5 archivos por request
  },
  fileFilter: fileFilter
});

/**
 * Middleware para subir un solo archivo
 */
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return ResponseUtils.error(res, 'El archivo es demasiado grande', 413);
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return ResponseUtils.error(res, 'Campo de archivo inesperado', 400);
        }
        return ResponseUtils.error(res, `Error de subida: ${err.message}`, 400);
      } else if (err) {
        return ResponseUtils.error(res, err.message, 400);
      }
      
      next();
    });
  };
};

/**
 * Middleware para subir múltiples archivos
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return ResponseUtils.error(res, 'Uno o más archivos son demasiado grandes', 413);
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return ResponseUtils.error(res, 'Demasiados archivos', 400);
        }
        return ResponseUtils.error(res, `Error de subida: ${err.message}`, 400);
      } else if (err) {
        return ResponseUtils.error(res, err.message, 400);
      }
      
      next();
    });
  };
};

/**
 * Middleware para subir archivos de campos específicos
 */
const uploadFields = (fields) => {
  return (req, res, next) => {
    upload.fields(fields)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return ResponseUtils.error(res, 'Uno o más archivos son demasiado grandes', 413);
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return ResponseUtils.error(res, 'Campo de archivo inesperado', 400);
        }
        return ResponseUtils.error(res, `Error de subida: ${err.message}`, 400);
      } else if (err) {
        return ResponseUtils.error(res, err.message, 400);
      }
      
      next();
    });
  };
};

/**
 * Función para subir archivo a Cloudinary
 */
const uploadToCloudinary = async (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'auto',
      folder: options.folder || 'destored',
      public_id: options.public_id,
      transformation: options.transformation,
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

/**
 * Función para eliminar archivo de Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Error eliminando archivo: ${error.message}`);
  }
};

/**
 * Función para obtener tipo de archivo
 */
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf') return 'document';
  if (mimetype.includes('document') || mimetype.includes('text') || 
      mimetype.includes('spreadsheet') || mimetype.includes('presentation')) {
    return 'document';
  }
  return 'other';
};

/**
 * Middleware para procesar archivos después de la subida
 */
const processFiles = async (req, res, next) => {
  try {
    if (req.file) {
      // Procesar archivo único
      const uploadResult = await uploadToCloudinary(req.file, {
        folder: `destored/${req.user?.role || 'general'}`
      });

      req.uploadedFile = {
        filename: `${uploadResult.public_id}.${uploadResult.format}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        url: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        fileType: getFileType(req.file.mimetype)
      };
    }

    if (req.files) {
      // Procesar múltiples archivos
      const uploadPromises = (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
        .map(file => uploadToCloudinary(file, {
          folder: `destored/${req.user?.role || 'general'}`
        }));

      const uploadResults = await Promise.all(uploadPromises);
      
      req.uploadedFiles = uploadResults.map((result, index) => {
        const file = Array.isArray(req.files) ? req.files[index] : Object.values(req.files).flat()[index];
        return {
          filename: `${result.public_id}.${result.format}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          url: result.secure_url,
          cloudinaryPublicId: result.public_id,
          fileType: getFileType(file.mimetype)
        };
      });
    }

    next();
  } catch (error) {
    ResponseUtils.error(res, `Error procesando archivos: ${error.message}`, 500);
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadToCloudinary,
  deleteFromCloudinary,
  processFiles,
  getFileType
};
