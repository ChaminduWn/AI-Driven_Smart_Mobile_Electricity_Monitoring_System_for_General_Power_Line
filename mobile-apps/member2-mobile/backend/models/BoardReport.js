const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BoardReport = sequelize.define('BoardReport', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    householderId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    categoryId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    categoryTitle: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    issuePoints: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    district: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    locationLat: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    locationLng: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    issuePhotos: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    status: {
        type: DataTypes.ENUM('Reported', 'WorkingOnIt', 'Done'),
        allowNull: false,
        defaultValue: 'Reported',
    },
    statusMessage: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Issue reported to the electricity board',
    },
    adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    statusUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    indexes: [
        { fields: ['householderId'] },
        { fields: ['status'] },
        { fields: ['createdAt'] },
    ],
});

module.exports = BoardReport;
