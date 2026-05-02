const User = require('../models/User');
const Job = require('../models/Job');
const BoardReport = require('../models/BoardReport');
const Service = require('../models/Service');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { buildUserPayload, normalizeQualificationCertificates } = require('../utils/userPayload');

exports.getDashboardMetrics = async (req, res) => {
    try {
        const totalUsers = await User.count({ where: { role: 'Householder' } });
        const activeTechnicians = await User.count({ where: { role: 'Electrician', isVerified: true } });
        const pendingTechnicians = await User.count({ where: { role: 'Electrician', isVerified: false } });
        const activeJobs = await Job.count({ where: { status: { [Op.in]: ['Pending', 'Accepted', 'InProgress', 'PaymentPending', 'AwaitingTechnicianConfirmation'] } } });
        const boardReportsOpen = await BoardReport.count({ where: { status: { [Op.in]: ['Reported', 'WorkingOnIt'] } } });
        const boardReportsResolved = await BoardReport.count({ where: { status: 'Done' } });

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

        const recentBoardReportsRaw = await BoardReport.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5,
        });

        const householderIds = [...new Set(recentBoardReportsRaw.map((report) => report.householderId))];
        const householders = await User.findAll({
            where: { id: householderIds },
            attributes: ['id', 'firstName', 'lastName', 'phone'],
        });
        const householderMap = householders.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {});

        const recentBoardReports = recentBoardReportsRaw.map((report) => {
            const reporter = householderMap[report.householderId];
            return {
                ...report.toJSON(),
                reporterName: reporter ? `${reporter.firstName || ''} ${reporter.lastName || ''}`.trim() || reporter.phone : 'Unknown reporter',
                reporterPhone: reporter?.phone || '',
            };
        });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeTechnicians,
                pendingTechnicians,
                activeJobs,
                boardReportsOpen,
                boardReportsResolved,
                totalRevenue,
                revenueData,
                geoData,
                recentBoardReports,
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
        res.status(200).json({
            success: true,
            data: technicians.map((technician) => buildUserPayload(technician)),
        });
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

        if (isVerified !== undefined) {
            tech.isVerified = isVerified;
            if (isVerified) {
                tech.isAvailable = true;
            }
        }
        if (isAvailable !== undefined) tech.isAvailable = isAvailable;

        await tech.save();
        res.status(200).json({ success: true, data: tech });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.reviewTechnicianCertificate = async (req, res) => {
    try {
        const { id, certificateId } = req.params;
        const { status, reviewNotes } = req.body;

        if (!['Accepted', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid certificate status' });
        }

        const technician = await User.findOne({ where: { id, role: 'Electrician' } });
        if (!technician) {
            return res.status(404).json({ success: false, message: 'Technician not found' });
        }

        const certificates = normalizeQualificationCertificates(technician);
        const updatedCertificates = certificates.map((certificate) =>
            certificate.id === certificateId
                ? {
                      ...certificate,
                      status,
                      reviewNotes: reviewNotes || certificate.reviewNotes || '',
                      reviewedAt: new Date().toISOString(),
                  }
                : certificate
        );

        if (!updatedCertificates.some((certificate) => certificate.id === certificateId)) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        technician.qualificationCertificates = updatedCertificates;
        await technician.save();

        return res.status(200).json({
            success: true,
            data: buildUserPayload(technician),
        });
    } catch (error) {
        console.error('Review Technician Certificate Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.getOngoingJobs = async (_req, res) => {
    try {
        const jobs = await Job.findAll({
            where: {
                status: {
                    [Op.in]: ['Accepted', 'InProgress', 'PaymentPending', 'AwaitingTechnicianConfirmation'],
                },
            },
            order: [['updatedAt', 'DESC']],
        });

        const userIds = [...new Set(jobs.flatMap((job) => [job.householderId, job.electricianId]).filter(Boolean))];
        const users = await User.findAll({
            where: { id: userIds },
            attributes: ['id', 'firstName', 'lastName', 'phone', 'district', 'rating'],
        });
        const userMap = users.reduce((acc, user) => {
            acc[user.id] = user.toJSON();
            return acc;
        }, {});

        const data = jobs.map((job) => ({
            ...job.toJSON(),
            householder: userMap[job.householderId]
                ? {
                      id: userMap[job.householderId].id,
                      name: `${userMap[job.householderId].firstName || ''} ${userMap[job.householderId].lastName || ''}`.trim(),
                      phone: userMap[job.householderId].phone,
                      district: userMap[job.householderId].district,
                  }
                : null,
            electrician: userMap[job.electricianId]
                ? {
                      id: userMap[job.electricianId].id,
                      name: `${userMap[job.electricianId].firstName || ''} ${userMap[job.electricianId].lastName || ''}`.trim(),
                      phone: userMap[job.electricianId].phone,
                      district: userMap[job.electricianId].district,
                      rating: userMap[job.electricianId].rating,
                  }
                : null,
        }));

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Get Ongoing Jobs Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error', details: error.message });
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
        const services = await Service.findAll({ order: [['displayOrder', 'ASC'], ['category', 'ASC'], ['serviceId', 'ASC']] });
        res.status(200).json({ success: true, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { basePrice, isActive, name, description, category } = req.body;

        const service = await Service.findByPk(id);
        if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

        if (basePrice !== undefined) service.basePrice = basePrice;
        if (isActive !== undefined) service.isActive = isActive;
        if (name !== undefined) service.name = name;
        if (description !== undefined) service.description = description;
        if (category !== undefined) service.category = category;

        await service.save();
        res.status(200).json({ success: true, data: service });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getBoardReports = async (req, res) => {
    try {
        const reports = await BoardReport.findAll({
            order: [['createdAt', 'DESC']],
        });

        const householderIds = [...new Set(reports.map((report) => report.householderId))];
        const householders = await User.findAll({
            where: { id: householderIds },
            attributes: ['id', 'firstName', 'lastName', 'phone', 'email', 'district'],
        });

        const householderMap = householders.reduce((acc, user) => {
            acc[user.id] = user.toJSON();
            return acc;
        }, {});

        const data = reports.map((report) => {
            const reporter = householderMap[report.householderId] || {};
            return {
                ...report.toJSON(),
                reporterName: `${reporter.firstName || ''} ${reporter.lastName || ''}`.trim(),
                reporterPhone: reporter.phone || '',
                reporterEmail: reporter.email || '',
                reporterDistrict: reporter.district || '',
            };
        });

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Get Board Reports Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateBoardReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, statusMessage, adminNotes } = req.body;

        const report = await BoardReport.findByPk(id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Board report not found' });
        }

        const defaultMessages = {
            Reported: 'Issue reported to the electricity board',
            WorkingOnIt: 'Working on it',
            Done: 'Issue resolved',
        };

        if (status) {
            report.status = status;
            report.statusMessage = statusMessage || defaultMessages[status] || report.statusMessage;
            report.statusUpdatedAt = new Date();
            report.resolvedAt = status === 'Done' ? new Date() : null;
        }

        if (adminNotes !== undefined) {
            report.adminNotes = adminNotes;
        }

        await report.save();

        res.status(200).json({ success: true, data: report });
    } catch (error) {
        console.error('Update Board Report Status Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
