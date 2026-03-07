const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Job = sequelize.define('Job', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    householderId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    electricianId: {
        type: DataTypes.UUID,
        allowNull: true, // Null until an electrician accepts
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    locationLat: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    locationLng: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    district: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    subCategory: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Accepted', 'InProgress', 'Completed', 'Cancelled'),
        defaultValue: 'Pending',
    },
    issuePhotos: {
        type: DataTypes.JSON, // Array of image URLs
        allowNull: true,
        defaultValue: [],
    },
    startCode: {
        type: DataTypes.STRING(4), // 4-digit code generated upon acceptance
        allowNull: true,
    },
    startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    cancellationReason: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    travelFeeApplied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    estimatedCost: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    finalCost: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    paymentMethod: {
        type: DataTypes.ENUM('Cash', 'Digital'),
        allowNull: true,
    }
});

module.exports = Job;
