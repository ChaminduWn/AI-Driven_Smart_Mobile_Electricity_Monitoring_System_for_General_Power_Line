import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Outage = sequelize.define('Outage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  issueId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Open', 'Assigned', 'In Progress', 'Resolved', 'NEW', 'PENDING', 'RESOLVED'),
    defaultValue: 'Open',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical', 'Urgent'),
    defaultValue: 'Medium',
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  district: {
    type: DataTypes.STRING,
    allowNull: true
  },
  area: {
    type: DataTypes.STRING,
    allowNull: true
  },
  feeder: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transformer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reportedBy: {
    type: DataTypes.ENUM('Technician', 'Householder'),
    allowNull: false
  },
  reporterName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reporterPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reportedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  assignedTechnicianIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  }
}, {
  tableName: 'outages',
  timestamps: true
});

export default Outage;