const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    serviceId: {
        type: DataTypes.STRING, // e.g., 'SC001'
        allowNull: false,
        unique: true,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    categoryKey: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    basePrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
});

module.exports = Service;
