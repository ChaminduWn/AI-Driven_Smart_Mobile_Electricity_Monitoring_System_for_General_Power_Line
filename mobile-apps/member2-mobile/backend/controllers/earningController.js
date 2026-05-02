const User = require('../models/User');
const Job = require('../models/Job');

const toCurrencyValue = (amount) => Number(Number(amount || 0).toFixed(2));

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
        const householderIds = [...new Set(jobs.map((job) => job.householderId).filter(Boolean))];
        const householders = await User.findAll({
            where: { id: householderIds },
            attributes: ['id', 'firstName', 'lastName'],
        });
        const householderMap = householders.reduce((acc, item) => {
            acc[item.id] = `${item.firstName || ''} ${item.lastName || ''}`.trim();
            return acc;
        }, {});

        const transactions = jobs.map(job => ({
            id: job.id,
            client: householderMap[job.householderId] || `Client: ${job.householderId.substring(0, 4)}`,
            amount: `+LKR ${job.finalCost || job.estimatedCost || 0}`,
            date: new Date(job.updatedAt).toLocaleDateString(),
            type: job.status,
            paymentMethod: job.paymentMethod || 'Digital',
        }));

        const grossCompletedAmount = jobs.reduce((sum, job) => sum + Number(job.finalCost || job.estimatedCost || 0), 0);
        const digitalTransactionsAmount = jobs
            .filter((job) => job.paymentMethod === 'Digital')
            .reduce((sum, job) => sum + Number(job.finalCost || job.estimatedCost || 0), 0);
        const cashInHandAmount = jobs
            .filter((job) => job.paymentMethod === 'Cash')
            .reduce((sum, job) => sum + Number(job.finalCost || job.estimatedCost || 0), 0);

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
                totalEarnings: grossCompletedAmount,
                cashInHandAmount,
                digitalTransactionsAmount,
                withdrawableBalance: electrician.digitalBalance || 0,
                transactions,
                weeklyData: weeklyEarningsData
            }
        });

    } catch (error) {
        console.error('Fetch Earnings Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.withdrawEarnings = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { amount, method } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const withdrawAmount = Number(amount);
        if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {
            return res.status(400).json({ success: false, message: 'A valid withdrawal amount is required' });
        }

        const electrician = await User.findByPk(userId, {
            attributes: ['id', 'digitalBalance']
        });

        if (!electrician) {
            return res.status(404).json({ success: false, message: 'Electrician not found' });
        }

        const availableBalance = Number(electrician.digitalBalance || 0);
        if (withdrawAmount > availableBalance) {
            return res.status(400).json({ success: false, message: 'Withdrawal amount exceeds available digital balance' });
        }

        electrician.digitalBalance = toCurrencyValue(availableBalance - withdrawAmount);
        await electrician.save();

        return res.status(200).json({
            success: true,
            message: `Withdrawal request sent via ${method || 'selected gateway'}`,
            withdrawal: {
                amount: toCurrencyValue(withdrawAmount),
                method: method || 'Gateway',
                confirmationRef: `WD-${Date.now()}`,
                remainingBalance: electrician.digitalBalance,
            },
        });
    } catch (error) {
        console.error('Withdraw Earnings Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
