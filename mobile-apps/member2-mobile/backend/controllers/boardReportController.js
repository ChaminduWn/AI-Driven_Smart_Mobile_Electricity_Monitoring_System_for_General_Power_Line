const BoardReport = require('../models/BoardReport');

exports.createBoardReport = async (req, res) => {
    try {
        const {
            householderId,
            categoryId,
            categoryTitle,
            issuePoints,
            address,
            district,
            locationLat,
            locationLng,
            issuePhotos,
        } = req.body;

        if (!householderId || !categoryId || !categoryTitle || !address || locationLat === undefined || locationLng === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required board report fields.' });
        }

        const report = await BoardReport.create({
            householderId,
            categoryId,
            categoryTitle,
            issuePoints: Array.isArray(issuePoints) ? issuePoints : [],
            address,
            district: district || null,
            locationLat,
            locationLng,
            issuePhotos: Array.isArray(issuePhotos) ? issuePhotos : [],
            statusUpdatedAt: new Date(),
        });

        res.status(201).json({
            success: true,
            message: 'Board report created successfully',
            report,
        });
    } catch (error) {
        console.error('Create Board Report Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', details: error.message });
    }
};

exports.getUserBoardReports = async (req, res) => {
    try {
        const { userId } = req.params;

        const reports = await BoardReport.findAll({
            where: { householderId: userId },
            order: [['createdAt', 'DESC']],
        });

        res.status(200).json({ success: true, reports });
    } catch (error) {
        console.error('Fetch User Board Reports Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getBoardReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await BoardReport.findByPk(id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Board report not found' });
        }

        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error('Fetch Board Report Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
