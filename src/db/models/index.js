const { sequelize } = require('../config/database');

// Importar todos los modelos
const User = require('./User');
const Professional = require('./Professional');
const Client = require('./Client');
const Admin = require('./Admin');
const Project = require('./Project');
const Application = require('./Application');
const Skill = require('./Skill');

// Importar modelos adicionales
const {
  Mentorship,
  Consultation,
  Convocatoria,
  Requirement,
  Payment,
  Review,
  Certification,
  Portfolio,
  Message,
  Notification,
  Service,
  File
} = require('./AdditionalModels');

// Definir asociaciones
const defineAssociations = () => {
  // Usuario - Perfiles específicos (One to One)
  User.hasOne(Professional, { foreignKey: 'user_id', as: 'professionalProfile' });
  Professional.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasOne(Client, { foreignKey: 'user_id', as: 'clientProfile' });
  Client.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasOne(Admin, { foreignKey: 'user_id', as: 'adminProfile' });
  Admin.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Usuario - Proyectos
  User.hasMany(Project, { foreignKey: 'client_id', as: 'clientProjects' });
  Project.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

  Project.belongsTo(User, { foreignKey: 'assigned_professional_id', as: 'assignedProfessional' });
  User.hasMany(Project, { foreignKey: 'assigned_professional_id', as: 'assignedProjects' });

  // Usuario - Mentorías
  User.hasMany(Mentorship, { foreignKey: 'mentor_id', as: 'mentorships' });
  Mentorship.belongsTo(User, { foreignKey: 'mentor_id', as: 'mentor' });

  User.hasMany(Mentorship, { foreignKey: 'mentee_id', as: 'menteeships' });
  Mentorship.belongsTo(User, { foreignKey: 'mentee_id', as: 'mentee' });

  // Usuario - Consultas
  User.hasMany(Consultation, { foreignKey: 'professional_id', as: 'professionalConsultations' });
  Consultation.belongsTo(User, { foreignKey: 'professional_id', as: 'professional' });

  User.hasMany(Consultation, { foreignKey: 'client_id', as: 'clientConsultations' });
  Consultation.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

  // Usuario - Aplicaciones
  User.hasMany(Application, { foreignKey: 'professional_id', as: 'applications' });
  Application.belongsTo(User, { foreignKey: 'professional_id', as: 'professional' });

  // Proyecto - Aplicaciones
  Project.hasMany(Application, { foreignKey: 'project_id', as: 'applications' });
  Application.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

  // Usuario - Reseñas (como autor)
  User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'givenReviews' });
  Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });

  // Usuario - Reseñas (como receptor)
  User.hasMany(Review, { foreignKey: 'reviewed_id', as: 'receivedReviews' });
  Review.belongsTo(User, { foreignKey: 'reviewed_id', as: 'reviewed' });

  // Proyecto - Reseñas
  Project.hasMany(Review, { foreignKey: 'project_id', as: 'reviews' });
  Review.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

  // Usuario - Habilidades (Many to Many)
  User.belongsToMany(Skill, { 
    through: 'user_skills', 
    foreignKey: 'user_id', 
    otherKey: 'skill_id',
    as: 'skills'
  });
  Skill.belongsToMany(User, { 
    through: 'user_skills', 
    foreignKey: 'skill_id', 
    otherKey: 'user_id',
    as: 'users'
  });

  // Usuario - Certificaciones
  User.hasMany(Certification, { foreignKey: 'user_id', as: 'certifications' });
  Certification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Usuario - Portafolios
  User.hasMany(Portfolio, { foreignKey: 'user_id', as: 'portfolios' });
  Portfolio.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Usuario - Mensajes
  User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
  Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

  User.hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });
  Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

  // Usuario - Notificaciones
  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Usuario - Pagos
  User.hasMany(Payment, { foreignKey: 'payer_id', as: 'payments' });
  Payment.belongsTo(User, { foreignKey: 'payer_id', as: 'payer' });

  User.hasMany(Payment, { foreignKey: 'recipient_id', as: 'receivedPayments' });
  Payment.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' });

  // Proyecto - Pagos
  Project.hasMany(Payment, { foreignKey: 'project_id', as: 'payments' });
  Payment.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

  // Usuario - Servicios
  User.hasMany(Service, { foreignKey: 'professional_id', as: 'services' });
  Service.belongsTo(User, { foreignKey: 'professional_id', as: 'professional' });

  // Usuario - Archivos
  User.hasMany(File, { foreignKey: 'uploaded_by', as: 'uploadedFiles' });
  File.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

  // Proyecto - Archivos
  Project.hasMany(File, { foreignKey: 'project_id', as: 'files' });
  File.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

  // Portfolio - Archivos
  Portfolio.hasMany(File, { foreignKey: 'portfolio_id', as: 'files' });
  File.belongsTo(Portfolio, { foreignKey: 'portfolio_id', as: 'portfolio' });

  // Convocatoria - Aplicaciones
  Convocatoria.hasMany(Application, { foreignKey: 'convocatoria_id', as: 'applications' });
  Application.belongsTo(Convocatoria, { foreignKey: 'convocatoria_id', as: 'convocatoria' });

  // Usuario - Convocatorias (creador)
  User.hasMany(Convocatoria, { foreignKey: 'created_by', as: 'createdConvocatorias' });
  Convocatoria.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

  // Requirement - Proyecto
  Project.hasMany(Requirement, { foreignKey: 'project_id', as: 'projectRequirements' });
  Requirement.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

  // Usuario - Requirements (creador)
  User.hasMany(Requirement, { foreignKey: 'client_id', as: 'clientRequirements' });
  Requirement.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
};

// Ejecutar definición de asociaciones
defineAssociations();

module.exports = {
  sequelize,
  User,
  Professional,
  Client,
  Admin,
  Project,
  Application,
  Skill,
  Mentorship,
  Consultation,
  Convocatoria,
  Requirement,
  Payment,
  Review,
  Certification,
  Portfolio,
  Message,
  Notification,
  Service,
  File
};
