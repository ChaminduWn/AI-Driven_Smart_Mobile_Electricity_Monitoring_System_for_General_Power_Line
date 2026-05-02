const User = require('../models/User');
const Job = require('../models/Job');
const { Op } = require('sequelize');
const { buildUserPayload, normalizeQualificationCertificates } = require('../utils/userPayload');

const loadUserStats = async (user) => {
    if (!user) {
        return {};
    }

    if (user.role !== 'Electrician') {
        return {};
    }

    const [completedJobsCount, acceptedJobsCount] = await Promise.all([
        Job.count({
            where: {
                electricianId: user.id,
                status: 'Completed',
            },
        }),
        Job.count({
            where: {
                electricianId: user.id,
                status: {
                    [Op.in]: ['Accepted', 'InProgress', 'PaymentPending', 'AwaitingTechnicianConfirmation'],
                },
            },
        }),
    ]);

    return {
        completedJobsCount,
        acceptedJobsCount,
    };
};

exports.getProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const stats = await loadUserStats(user);
        return res.status(200).json({ success: true, user: buildUserPayload(user, stats) });
    } catch (error) {
        console.error('Get Profile Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, phone, district, address } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phone = phone || user.phone;
        user.district = district || user.district;
        user.address = address || user.address;

        await user.save();
        const stats = await loadUserStats(user);
        res.status(200).json({ success: true, message: 'Profile updated successfully', user: buildUserPayload(user, stats) });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.uploadQualificationCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl, title } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ success: false, message: 'Certificate image is required' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'Electrician') {
            return res.status(403).json({ success: false, message: 'Only technicians can upload qualification certificates' });
        }

        const certificates = normalizeQualificationCertificates(user);

        const certificate = {
            id: `cert-${Date.now()}`,
            title: title || `Qualification Certificate ${certificates.length + 1}`,
            imageUrl,
            status: 'Pending',
            uploadedAt: new Date().toISOString(),
            reviewedAt: null,
            reviewNotes: '',
        };

        user.qualificationCertificates = [...certificates, certificate];
        await user.save();

        const stats = await loadUserStats(user);
        return res.status(200).json({
            success: true,
            message: 'Qualification certificate uploaded successfully',
            user: buildUserPayload(user, stats),
            certificate,
        });
    } catch (error) {
        console.error('Upload Qualification Certificate Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};
