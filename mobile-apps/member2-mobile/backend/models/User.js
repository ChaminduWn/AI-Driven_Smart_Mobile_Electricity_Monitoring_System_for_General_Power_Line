const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    district: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('Householder', 'Electrician'),
        allowNull: false,
    },
    displayId: {
        type: DataTypes.STRING,
        allowNull: true, // Generated after creation
    },
    // Additional fields for Electrician Verification & Profile
    vehicleNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    nvqCertificateUrl: {
        type: DataTypes.STRING,
        allowNull: true, // Uploaded by Electrician during Registration
    },
    qualificationCertificates: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Must be true to accept jobs
    },
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
    isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    // Electrician Earnings Tracking
    cashCollected: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
    digitalBalance: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
    commissionOwed: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    }
});

module.exports = User;
