const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    try {
        console.log('Signup initialized with body:', req.body);
        const { firstName, lastName, address, district, phone, email, password, role, nvqCertificateUrl } = req.body;

        // Check if user exists by email OR phone
        console.log('Checking if user exists for email or phone:', email, phone);
        const { Op } = require('sequelize'); // Import Op here for the OR query
        let existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }, { phone }]
            }
        });

        if (existingUser) {
            console.log('User already exists');
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'User with this email already exists' });
            } else {
                return res.status(400).json({ message: 'User with this phone number already exists' });
            }
        }

        // Hash password
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        console.log('Creating User in DB...');
        const user = await User.create({
            firstName,
            lastName,
            address,
            district,
            phone,
            email,
            password: hashedPassword,
            role,
            nvqCertificateUrl,
        });
        console.log('User created:', user.id);

        // Generate Display ID
        // Count users with same role to generate ID like 00H#1
        const count = await User.count({ where: { role } });
        const prefix = role === 'Householder' ? '00H' : '00E';
        user.displayId = `${prefix}#${count}`; // Note: count might be off if deleted, but simple enough for now
        await user.save();

        res.status(201).json({ message: 'User registered successfully', user: { id: user.id, displayId: user.displayId, role: user.role } });
    } catch (error) {
        console.error('--- SIGNUP ERROR CAUGHT ---');
        console.error('Error Message:', error.message);
        console.error('Error Name:', error.name);
        if (error.errors) {
            console.error('Validation Errors:', JSON.stringify(error.errors, null, 2));
        }
        console.error('Full Stack:', error.stack);
        console.error('---------------------------');
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check User by email or phone
        const { Op } = require('sequelize');
        const user = await User.findOne({
            where: {
                [Op.or]: [{ email }, { phone: email }]
            }
        });
        if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

        // Validate Password
        // Reconstruct the frontend prefix based on the found user's role
        const prefix = user.role === 'Householder' ? '00H-' : '00E-';
        const fullPassword = prefix + password;

        const isMatch = await bcrypt.compare(fullPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        // Generate Token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                displayId: user.displayId
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, firstName: user.firstName, role: user.role, displayId: user.displayId } });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
