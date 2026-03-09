import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Technician = sequelize.define('Technician', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  technicianId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attendanceStatus: {
    type: DataTypes.ENUM('Present', 'Absent'),
    defaultValue: 'Present'
  },
  availability: {
    type: DataTypes.ENUM('Available', 'On Task', 'Off Duty'),
    defaultValue: 'Available'
  },
  currentTaskId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  vehicleNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vehicleType: {
    type: DataTypes.ENUM('Bike', 'Van', 'Truck'),
    allowNull: true
  },
  vehicleAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'technicians',
  timestamps: true
});

export default Technician;