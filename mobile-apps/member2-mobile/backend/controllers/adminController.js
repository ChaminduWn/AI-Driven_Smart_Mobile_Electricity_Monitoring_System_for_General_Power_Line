const User = require('../models/User');
const Job = require('../models/Job');
const Service = require('../models/Service');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getDashboardMetrics = async (req, res) => {
    try {
        const totalUsers = await User.count({ where: { role: 'Householder' } });
        const activeTechnicians = await User.count({ where: { role: 'Electrician', isVerified: true } });
        const pendingTechnicians = await User.count({ where: { role: 'Electrician', isVerified: false } });
        const activeJobs = await Job.count({ where: { status: { [Op.in]: ['Pending', 'Accepted', 'InProgress'] } } });

        // Summing up finalCost for monthly revenue (10% commission logic)
        const jobsCompleted = await Job.findAll({ where: { status: 'Completed' } });
        const totalRevenue = jobsCompleted.reduce((sum, job) => sum + ((job.finalCost || 0) * 0.1), 0);

        // Revenue Trend (Last 7 months)
        const revenueData = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const d = new Date();
        d.setDate(1); // Set to first day to avoid skipping
        for (let i = 6; i >= 0; i--) {
            const tempDate = new Date(d);
            tempDate.setMonth(d.getMonth() - i);
            const startOfMonth = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1);
            const endOfMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0, 23, 59, 59);

            const monthJobs = jobsCompleted.filter(j => new Date(j.createdAt) >= startOfMonth && new Date(j.createdAt) <= endOfMonth);
            const monthRev = monthJobs.reduce((sum, j) => sum + ((j.finalCost || 0) * 0.1), 0);

            revenueData.push({ month: monthNames[tempDate.getMonth()], revenue: monthRev });
        }

        // Jobs by District
        const districtGroups = await Job.findAll({
            attributes: ['district', [sequelize.fn('COUNT', '*'), 'count']],
            group: ['district'],
            order: [[sequelize.literal('count'), 'DESC']],
            limit: 5 // Top 5 districts
        });

        const geoData = districtGroups.map(d => ({
            district: d.district || 'Unknown',
            count: parseInt(d.dataValues.count, 10)
        }));

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeTechnicians,
                pendingTechnicians,
                activeJobs,
                totalRevenue,
                revenueData,
                geoData
            }
        });
    } catch (error) {
        console.error('Dashboard Analytics Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getTechnicians = async (req, res) => {
    try {
        const technicians = await User.findAll({
            where: { role: 'Electrician' },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: technicians });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateTechnicianStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified, isAvailable } = req.body;

        const tech = await User.findOne({ where: { id, role: 'Electrician' } });
        if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });

        if (isVerified !== undefined) tech.isVerified = isVerified;
        if (isAvailable !== undefined) tech.isAvailable = isAvailable;

        await tech.save();
        res.status(200).json({ success: true, data: tech });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { role: 'Householder' },
            order: [['createdAt', 'DESC']]
        });

        // Pre-count bookings (Jobs) per user
        const jobsCount = await Job.findAll({
            attributes: ['householderId', [require('sequelize').fn('COUNT', '*'), 'totalBookings']],
            group: ['householderId']
        });

        const countMap = {};
        jobsCount.forEach(jc => {
            countMap[jc.householderId] = parseInt(jc.dataValues.totalBookings, 10);
        });

        const usersWithBookings = users.map(u => ({
            ...u.toJSON(),
            totalBookings: countMap[u.id] || 0
        }));

        res.status(200).json({ success: true, data: usersWithBookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.updateUserSuspension = async (req, res) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body; // Using isAvailable to denote suspension false=suspended

        const user = await User.findOne({ where: { id, role: 'Householder' } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.isAvailable = isAvailable;
        await user.save();

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getServices = async (req, res) => {
    try {
        const services = await Service.findAll({ order: [['category', 'ASC'], ['serviceId', 'ASC']] });
        res.status(200).json({ success: true, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { basePrice, isActive } = req.body;

        const service = await Service.findByPk(id);
        if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

        if (basePrice !== undefined) service.basePrice = basePrice;
        if (isActive !== undefined) service.isActive = isActive;

        await service.save();
        res.status(200).json({ success: true, data: service });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
