const Job = require('../models/Job');

exports.createJob = async (req, res) => {
    try {
        const { householderId, title, description, locationLat, locationLng, district, category, subCategory, issuePhotos } = req.body;

        // Generate a random 4 digit start code
        const startCode = Math.floor(1000 + Math.random() * 9000).toString();

        const job = await Job.create({
            householderId, // Assume passed from frontend or extracted from req.user
            title,
            description,
            locationLat,
            locationLng,
            district,
            category,
            subCategory,
            issuePhotos: issuePhotos || [],
            startCode,
        });

        res.status(201).json({ success: true, message: 'Job created successfully', job });
    } catch (error) {
        console.error('Create Job Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.getJobsForElectrician = async (req, res) => {
    try {
        const { district } = req.user; // Assuming auth middleware sets this
        // Fetch pending jobs in the same district
        const jobs = await Job.findAll({
            where: {
                status: 'Pending',
                district: district
            },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, jobs });
    } catch (error) {
        console.error('Fetch Jobs Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getJobHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const jobs = await Job.findAll({
            where: {
                // Return jobs where the user is either the electrician or householder
                [require('sequelize').Op.or]: [
                    { electricianId: userId },
                    { householderId: userId }
                ]
            },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, jobs });
    } catch (error) {
        console.error('Fetch Job History Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.cancelJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findByPk(jobId);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const now = new Date();
        const diffInMs = now - job.createdAt;
        const diffInMinutes = Math.floor(diffInMs / 60000);

        // Apply travel fee if cancelled after 5 minutes
        const travelFeeApplied = diffInMinutes > 5;

        job.status = 'Cancelled';
        job.cancelledAt = now;
        job.travelFeeApplied = travelFeeApplied;
        job.cancellationReason = req.body.reason || 'Householder cancelled';

        await job.save();

        res.status(200).json({ success: true, message: 'Job cancelled successfully', travelFeeApplied });

    } catch (error) {
        console.error('Cancel Job Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
