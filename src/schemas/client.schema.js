const Joi = require('joi');

// Esquema para actualizar perfil de cliente
const updateClientProfileSchema = Joi.object({
  companyName: Joi.string().max(100),
  industry: Joi.string().max(50),
  companySize: Joi.string().valid('startup', 'pequena', 'mediana', 'grande', 'enterprise'),
  website: Joi.string().uri(),
  description: Joi.string().max(1000),
  location: Joi.string().max(100),
  timezone: Joi.string().max(50),
  preferredCommunication: Joi.string().valid('email', 'phone', 'chat', 'video'),
  budget: Joi.object({
    min: Joi.number().positive(),
    max: Joi.number().positive().greater(Joi.ref('min')),
    currency: Joi.string().valid('USD', 'EUR', 'COP', 'MXN').default('USD')
  })
});

// Esquema para crear review
const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).required(),
  workQuality: Joi.number().integer().min(1).max(5),
  communication: Joi.number().integer().min(1).max(5),
  timeliness: Joi.number().integer().min(1).max(5),
  professionalism: Joi.number().integer().min(1).max(5),
  wouldRecommend: Joi.boolean().default(true)
}).required();

// Esquema para actualizar review
const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  comment: Joi.string().max(1000),
  workQuality: Joi.number().integer().min(1).max(5),
  communication: Joi.number().integer().min(1).max(5),
  timeliness: Joi.number().integer().min(1).max(5),
  professionalism: Joi.number().integer().min(1).max(5),
  wouldRecommend: Joi.boolean()
});

// Esquema para filtros de proyectos
const getProjectsSchema = Joi.object({
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// Esquema para filtros de pagos
const getPaymentsSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded'),
  startDate: Joi.date(),
  endDate: Joi.date().greater(Joi.ref('startDate')),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// Esquema para filtros de reviews
const getReviewsSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// Esquema para crear disputa
const createDisputeSchema = Joi.object({
  projectId: Joi.number().integer().positive().required(),
  reason: Joi.string().valid(
    'trabajo_incompleto',
    'calidad_insatisfactoria', 
    'incumplimiento_plazo',
    'comunicacion_deficiente',
    'reembolso_solicitado',
    'otro'
  ).required(),
  description: Joi.string().max(1000).required(),
  evidence: Joi.array().items(Joi.string().uri()),
  desiredResolution: Joi.string().max(500)
}).required();

// Esquema para mensaje de disputa
const disputeMessageSchema = Joi.object({
  message: Joi.string().max(1000).required(),
  attachments: Joi.array().items(Joi.string().uri())
}).required();

module.exports = {
  updateClientProfileSchema,
  createReviewSchema,
  updateReviewSchema,
  getProjectsSchema,
  getPaymentsSchema,
  getReviewsSchema,
  createDisputeSchema,
  disputeMessageSchema
};
