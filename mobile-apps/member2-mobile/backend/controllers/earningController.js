const User = require('../models/User');
const Job = require('../models/Job');

exports.getEarnings = async (req, res) => {
    try {
        const userId = req.user?.id; // Assuming we wire auth middleware, or pass in params for dev
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const electrician = await User.findByPk(userId, {
            attributes: ['cashCollected', 'digitalBalance', 'commissionOwed']
        });

        if (!electrician) {
            return res.status(404).json({ success: false, message: 'Electrician not found' });
        }

        // Fetch Recent Transactions
        const jobs = await Job.findAll({
            where: {
                electricianId: userId,
                status: 'Completed'
            },
            order: [['updatedAt', 'DESC']],
            limit: 10
        });

        const transactions = jobs.map(job => ({
            id: job.id,
            client: `Client: ${job.householderId.substring(0, 4)}`, // Using hash segment as mock name for privacy
            amount: `+LKR ${job.finalCost || job.estimatedCost || 0}`,
            date: new Date(job.updatedAt).toLocaleDateString(),
            type: job.status
        }));

        // Generate dynamic weekly breakdown array mapping Monday=0 to Sunday=6
        // For brevity we will initialize array with 0 and sum up finalCosts for past 7 days based on getDay()
        const weeklyDataMap = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        jobs.forEach(job => {
            const date = new Date(job.updatedAt);
            const dayStr = dayNames[date.getDay()];
            weeklyDataMap[dayStr] += (job.finalCost || job.estimatedCost || 0);
        });

        const weeklyEarningsData = Object.keys(weeklyDataMap).map(day => ({
            day,
            amount: weeklyDataMap[day]
        }));

        res.status(200).json({
            success: true,
            earnings: {
                cashCollected: electrician.cashCollected || 0,
                digitalBalance: electrician.digitalBalance || 0,
                commissionOwed: electrician.commissionOwed || 0,
                totalEarnings: (electrician.cashCollected || 0) + (electrician.digitalBalance || 0) - (electrician.commissionOwed || 0),
                transactions,
                weeklyData: weeklyEarningsData
            }
        });

    } catch (error) {
        console.error('Fetch Earnings Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
