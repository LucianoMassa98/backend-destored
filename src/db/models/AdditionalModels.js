const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Mentorship extends Model {}

class Consultation extends Model {}

class Convocatoria extends Model {}

class Requirement extends Model {}

class Payment extends Model {}

class Review extends Model {}

class Certification extends Model {}

class Portfolio extends Model {}

class Message extends Model {}

class Notification extends Model {}

class Service extends Model {}

class File extends Model {}

// Mentorship Model
Mentorship.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    mentor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    mentee_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('free', 'paid'),
      defaultValue: 'free'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    duration_weeks: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Mentorship',
    tableName: 'mentorships'
  }
);

// Consultation Model
Consultation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    professional_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    area: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'scheduled'
    },
    meeting_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Consultation',
    tableName: 'consultations'
  }
);

// Convocatoria Model
Convocatoria.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    position_type: {
      type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'freelance'),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    remote_work: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    salary_min: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    salary_max: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    required_skills: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'open', 'closed', 'filled'),
      defaultValue: 'draft'
    }
  },
  {
    sequelize,
    modelName: 'Convocatoria',
    tableName: 'convocatorias'
  }
);

// Requirement Model
Requirement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'projects', key: 'id' }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Requirement',
    tableName: 'requirements'
  }
);

// Payment Model
Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    payer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    recipient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'projects', key: 'id' }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    platform_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    stripe_payment_intent_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments'
  }
);

// Review Model
Review.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reviewer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    reviewed_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'projects', key: 'id' }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews'
  }
);

// Resto de modelos con estructura básica
Certification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    name: { type: DataTypes.STRING(200), allowNull: false },
    issuer: { type: DataTypes.STRING(100), allowNull: false },
    credential_id: { type: DataTypes.STRING(100), allowNull: true },
    credential_url: { type: DataTypes.STRING, allowNull: true },
    issued_at: { type: DataTypes.DATE, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false }
  },
  { sequelize, modelName: 'Certification', tableName: 'certifications' }
);

Portfolio.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    project_url: { type: DataTypes.STRING, allowNull: true },
    repository_url: { type: DataTypes.STRING, allowNull: true },
    technologies: { type: DataTypes.JSONB, defaultValue: [] },
    images: { type: DataTypes.JSONB, defaultValue: [] },
    featured: { type: DataTypes.BOOLEAN, defaultValue: false }
  },
  { sequelize, modelName: 'Portfolio', tableName: 'portfolios' }
);

Message.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sender_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    receiver_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    subject: { type: DataTypes.STRING(200), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    read_at: { type: DataTypes.DATE, allowNull: true },
    message_type: { type: DataTypes.ENUM('text', 'file', 'system'), defaultValue: 'text' },
    attachments: { type: DataTypes.JSONB, defaultValue: [] }
  },
  { sequelize, modelName: 'Message', tableName: 'messages' }
);

Notification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    read_at: { type: DataTypes.DATE, allowNull: true },
    action_url: { type: DataTypes.STRING, allowNull: true },
    metadata: { type: DataTypes.JSONB, defaultValue: {} }
  },
  { sequelize, modelName: 'Notification', tableName: 'notifications' }
);

Service.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    professional_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.STRING(50), allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    delivery_time_days: { type: DataTypes.INTEGER, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    features: { type: DataTypes.JSONB, defaultValue: [] }
  },
  { sequelize, modelName: 'Service', tableName: 'services' }
);

File.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    uploaded_by: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    original_name: { type: DataTypes.STRING(255), allowNull: false },
    mime_type: { type: DataTypes.STRING(100), allowNull: false },
    size_bytes: { type: DataTypes.BIGINT, allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: false },
    cloudinary_public_id: { type: DataTypes.STRING, allowNull: true },
    project_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'projects', key: 'id' } },
    portfolio_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'portfolios', key: 'id' } },
    file_type: { type: DataTypes.ENUM('image', 'document', 'video', 'other'), allowNull: false }
  },
  { sequelize, modelName: 'File', tableName: 'files' }
);

module.exports = {
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
