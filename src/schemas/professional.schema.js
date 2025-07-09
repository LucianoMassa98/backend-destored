const Joi = require('joi');

// Esquema para actualizar perfil de profesional
const updateProfileSchema = Joi.object({
  title: Joi.string().max(100),
  description: Joi.string().max(1000),
  category: Joi.string().valid(
    'desarrollo', 'diseño', 'marketing', 'escritura', 
    'traduccion', 'video', 'musica', 'consultoria', 'otro'
  ),
  experienceYears: Joi.number().integer().min(0).max(50),
  hourlyRate: Joi.number().positive().max(10000),
  location: Joi.string().max(100),
  timezone: Joi.string().max(50),
  languages: Joi.array().items(Joi.string()),
  isAvailable: Joi.boolean(),
  workingHours: Joi.object({
    monday: Joi.object({
      start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      available: Joi.boolean()
    }),
    tuesday: Joi.object({
      start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      available: Joi.boolean()
    }),
    wednesday: Joi.object({
      start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      available: Joi.boolean()
    }),
    thursday: Joi.object({
      start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      available: Joi.boolean()
    }),
    friday: Joi.object({
      start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      available: Joi.boolean()
    }),
    saturday: Joi.object({
      start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      available: Joi.boolean()
    }),
    sunday: Joi.object({
      start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      available: Joi.boolean()
    })
  })
});

// Esquema para buscar profesionales
const searchProfessionalsSchema = Joi.object({
  skills: Joi.array().items(Joi.string()),
  category: Joi.string().valid(
    'desarrollo', 'diseño', 'marketing', 'escritura', 
    'traduccion', 'video', 'musica', 'consultoria', 'otro'
  ),
  experience: Joi.number().integer().min(0).max(50),
  location: Joi.string().max(100),
  priceRange: Joi.object({
    min: Joi.number().positive(),
    max: Joi.number().positive().greater(Joi.ref('min'))
  }),
  rating: Joi.number().min(1).max(5),
  availability: Joi.boolean(),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sortBy: Joi.string().valid(
    'createdAt', 'hourlyRate', 'experienceYears', 'firstName'
  ),
  sortOrder: Joi.string().valid('ASC', 'DESC')
});

// Esquema para agregar habilidad
const addSkillSchema = Joi.object({
  name: Joi.string().required().max(50),
  level: Joi.string().required().valid('principiante', 'intermedio', 'avanzado', 'experto'),
  category: Joi.string().max(50),
  yearsOfExperience: Joi.number().integer().min(0).max(50)
}).required();

// Esquema para actualizar habilidad
const updateSkillSchema = Joi.object({
  name: Joi.string().max(50),
  level: Joi.string().valid('principiante', 'intermedio', 'avanzado', 'experto'),
  category: Joi.string().max(50),
  yearsOfExperience: Joi.number().integer().min(0).max(50)
});

// Esquema para agregar proyecto al portafolio
const addPortfolioSchema = Joi.object({
  title: Joi.string().required().max(100),
  description: Joi.string().required().max(1000),
  imageUrl: Joi.string().uri(),
  projectUrl: Joi.string().uri(),
  technologies: Joi.array().items(Joi.string()),
  category: Joi.string().max(50),
  completionDate: Joi.date(),
  clientName: Joi.string().max(100),
  featured: Joi.boolean().default(false)
}).required();

// Esquema para actualizar proyecto del portafolio
const updatePortfolioSchema = Joi.object({
  title: Joi.string().max(100),
  description: Joi.string().max(1000),
  imageUrl: Joi.string().uri(),
  projectUrl: Joi.string().uri(),
  technologies: Joi.array().items(Joi.string()),
  category: Joi.string().max(50),
  completionDate: Joi.date(),
  clientName: Joi.string().max(100),
  featured: Joi.boolean()
});

// Esquema para agregar servicio
const addServiceSchema = Joi.object({
  name: Joi.string().required().max(100),
  description: Joi.string().required().max(1000),
  price: Joi.number().positive().required(),
  duration: Joi.number().positive(), // en horas
  category: Joi.string().required().max(50),
  deliverables: Joi.array().items(Joi.string()),
  requirements: Joi.string().max(500),
  isActive: Joi.boolean().default(true)
}).required();

// Esquema para actualizar servicio
const updateServiceSchema = Joi.object({
  name: Joi.string().max(100),
  description: Joi.string().max(1000),
  price: Joi.number().positive(),
  duration: Joi.number().positive(),
  category: Joi.string().max(50),
  deliverables: Joi.array().items(Joi.string()),
  requirements: Joi.string().max(500),
  isActive: Joi.boolean()
});

// Esquema para agregar certificación
const addCertificationSchema = Joi.object({
  name: Joi.string().required().max(100),
  institution: Joi.string().required().max(100),
  dateObtained: Joi.date().required(),
  expirationDate: Joi.date().greater(Joi.ref('dateObtained')),
  credentialId: Joi.string().max(100),
  credentialUrl: Joi.string().uri(),
  description: Joi.string().max(500)
}).required();

// Esquema para actualizar certificación
const updateCertificationSchema = Joi.object({
  name: Joi.string().max(100),
  institution: Joi.string().max(100),
  dateObtained: Joi.date(),
  expirationDate: Joi.date(),
  credentialId: Joi.string().max(100),
  credentialUrl: Joi.string().uri(),
  description: Joi.string().max(500)
});

module.exports = {
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
};
