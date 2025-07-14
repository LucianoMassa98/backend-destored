const Joi = require('joi');

const evaluateApplicationSchema = Joi.object({
  priority_score: Joi.number()
    .min(0)
    .max(100)
    .required()
    .messages({
      'number.base': 'La puntuación de prioridad debe ser un número',
      'number.min': 'La puntuación de prioridad debe ser al menos 0',
      'number.max': 'La puntuación de prioridad no puede exceder 100',
      'any.required': 'La puntuación de prioridad es requerida'
    }),
  client_feedback: Joi.string()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'El feedback debe tener al menos 10 caracteres',
      'string.max': 'El feedback no puede exceder 1000 caracteres'
    }),
  metadata: Joi.object()
    .optional()
    .messages({
      'object.base': 'Los metadatos deben ser un objeto válido'
    })
});

const approveApplicationSchema = Joi.object({
  client_feedback: Joi.string()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'El feedback debe tener al menos 10 caracteres',
      'string.max': 'El feedback no puede exceder 1000 caracteres'
    }),
  final_rate: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'La tarifa final debe ser un número',
      'number.positive': 'La tarifa final debe ser un número positivo'
    }),
  rate_negotiation_notes: Joi.string()
    .max(500)
    .optional()
    .when('final_rate', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'string.max': 'Las notas de negociación no pueden exceder 500 caracteres',
      'any.forbidden': 'Las notas de negociación solo son válidas cuando se especifica una tarifa final'
    })
});

const rejectApplicationSchema = Joi.object({
  reason: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.base': 'La razón del rechazo debe ser un texto',
      'string.min': 'La razón del rechazo debe tener al menos 10 caracteres',
      'string.max': 'La razón del rechazo no puede exceder 500 caracteres',
      'any.required': 'La razón del rechazo es requerida'
    }),
  client_feedback: Joi.string()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'El feedback debe tener al menos 10 caracteres',
      'string.max': 'El feedback no puede exceder 1000 caracteres'
    }),
  send_feedback_email: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'send_feedback_email debe ser un valor booleano'
    })
});

const withdrawApplicationSchema = Joi.object({
  reason: Joi.string()
    .min(5)
    .max(300)
    .optional()
    .messages({
      'string.min': 'La razón debe tener al menos 5 caracteres',
      'string.max': 'La razón no puede exceder 300 caracteres'
    })
});

const createApplicationSchema = Joi.object({
  cover_letter: Joi.string()
    .min(50)
    .max(2000)
    .required()
    .messages({
      'string.base': 'La carta de presentación debe ser un texto',
      'string.min': 'La carta de presentación debe tener al menos 50 caracteres',
      'string.max': 'La carta de presentación no puede exceder 2000 caracteres',
      'any.required': 'La carta de presentación es requerida'
    }),
  proposed_rate: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'La tarifa propuesta debe ser un número',
      'number.positive': 'La tarifa propuesta debe ser un número positivo'
    }),
  proposed_timeline: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'El cronograma propuesto debe ser un número',
      'number.integer': 'El cronograma propuesto debe ser un número entero',
      'number.positive': 'El cronograma propuesto debe ser un número positivo'
    }),
  availability_start: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.base': 'La fecha de disponibilidad debe ser una fecha válida',
      'date.format': 'La fecha de disponibilidad debe estar en formato ISO',
      'date.min': 'La fecha de disponibilidad no puede ser en el pasado'
    }),
  relevant_experience: Joi.string()
    .max(1500)
    .optional()
    .messages({
      'string.max': 'La experiencia relevante no puede exceder 1500 caracteres'
    }),
  questions_responses: Joi.object()
    .optional()
    .messages({
      'object.base': 'Las respuestas a preguntas deben ser un objeto válido'
    }),
  portfolio_items: Joi.array()
    .items(Joi.object({
      id: Joi.string().required(),
      title: Joi.string().required(),
      url: Joi.string().uri().optional(),
      description: Joi.string().max(300).optional()
    }))
    .max(10)
    .optional()
    .messages({
      'array.max': 'No puedes incluir más de 10 elementos del portafolio'
    }),
  rating_explanation: Joi.string()
    .max(800)
    .optional()
    .messages({
      'string.max': 'La explicación de la tarifa no puede exceder 800 caracteres'
    })
});

const updateApplicationSchema = Joi.object({
  cover_letter: Joi.string()
    .min(50)
    .max(2000)
    .optional()
    .messages({
      'string.min': 'La carta de presentación debe tener al menos 50 caracteres',
      'string.max': 'La carta de presentación no puede exceder 2000 caracteres'
    }),
  proposed_rate: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'La tarifa propuesta debe ser un número',
      'number.positive': 'La tarifa propuesta debe ser un número positivo'
    }),
  proposed_timeline: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'El cronograma propuesto debe ser un número',
      'number.integer': 'El cronograma propuesto debe ser un número entero',
      'number.positive': 'El cronograma propuesto debe ser un número positivo'
    }),
  availability_start: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.base': 'La fecha de disponibilidad debe ser una fecha válida',
      'date.format': 'La fecha de disponibilidad debe estar en formato ISO',
      'date.min': 'La fecha de disponibilidad no puede ser en el pasado'
    }),
  relevant_experience: Joi.string()
    .max(1500)
    .optional()
    .messages({
      'string.max': 'La experiencia relevante no puede exceder 1500 caracteres'
    }),
  questions_responses: Joi.object()
    .optional()
    .messages({
      'object.base': 'Las respuestas a preguntas deben ser un objeto válido'
    }),
  portfolio_items: Joi.array()
    .items(Joi.object({
      id: Joi.string().required(),
      title: Joi.string().required(),
      url: Joi.string().uri().optional(),
      description: Joi.string().max(300).optional()
    }))
    .max(10)
    .optional()
    .messages({
      'array.max': 'No puedes incluir más de 10 elementos del portafolio'
    }),
  rating_explanation: Joi.string()
    .max(800)
    .optional()
    .messages({
      'string.max': 'La explicación de la tarifa no puede exceder 800 caracteres'
    })
});

const applicationFiltersSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'under_review', 'accepted', 'rejected', 'withdrawn', 'expired')
    .optional(),
  project_id: Joi.string()
    .uuid()
    .optional(),
  professional_id: Joi.string()
    .uuid()
    .optional(),
  date_from: Joi.date()
    .iso()
    .optional(),
  date_to: Joi.date()
    .iso()
    .min(Joi.ref('date_from'))
    .optional(),
  rate_min: Joi.number()
    .positive()
    .optional(),
  rate_max: Joi.number()
    .positive()
    .min(Joi.ref('rate_min'))
    .optional(),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
});

module.exports = {
  evaluateApplicationSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
  withdrawApplicationSchema,
  createApplicationSchema,
  updateApplicationSchema,
  applicationFiltersSchema
};
