const User = require('../models/User');

exports.updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, phone, district } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phone = phone || user.phone;
        user.district = district || user.district;

        await user.save();

        res.status(200).json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
