const Service = require('../models/Service');
const Job = require('../models/Job');
const { Op } = require('sequelize');

exports.getMobileServices = async (_req, res) => {
    try {
        const services = await Service.findAll({
            where: { isActive: true },
            order: [['displayOrder', 'ASC'], ['category', 'ASC']],
        });

        res.status(200).json({ success: true, data: services });
    } catch (error) {
        console.error('Get Mobile Services Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.getTechnicianSetupServices = async (req, res) => {
    try {
        const { electricianId } = req.params;

        const [services, jobs] = await Promise.all([
            Service.findAll({
                where: { isActive: true },
                order: [['displayOrder', 'ASC'], ['category', 'ASC']],
            }),
            Job.findAll({
                where: {
                    [Op.or]: [
                        { electricianId },
                        { electricianId: null },
                    ],
                },
                attributes: ['serviceId', 'category', 'subCategory', 'electricianId'],
            }),
        ]);

        const totalsByServiceId = {};
        const acceptedByServiceId = {};

        jobs.forEach((job) => {
            const key = job.serviceId;
            if (!key) {
                return;
            }

            totalsByServiceId[key] = (totalsByServiceId[key] || 0) + 1;
            if (job.electricianId === electricianId) {
                acceptedByServiceId[key] = (acceptedByServiceId[key] || 0) + 1;
            }
        });

        const data = services.map((service) => ({
            ...service.toJSON(),
            totalRequests: totalsByServiceId[service.serviceId] || 0,
            acceptedByTechnician: acceptedByServiceId[service.serviceId] || 0,
        }));

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Get Technician Setup Services Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};
