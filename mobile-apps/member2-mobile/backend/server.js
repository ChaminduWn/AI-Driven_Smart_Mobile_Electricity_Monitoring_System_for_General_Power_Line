const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const sequelize = require('./config/database');

// Require all models to ensure they are registered with Sequelize before sync
require('./models/User');
require('./models/Job');
require('./models/BoardReport');
require('./models/Message');
require('./models/Service');
const { ensureMobileServiceCatalog } = require('./utils/serviceCatalogSeeder');

const app = express();
const PORT = process.env.PORT || 8003;

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

const jobRoutes = require('./routes/jobRoutes');
app.use('/api/jobs', jobRoutes);

const boardReportRoutes = require('./routes/boardReportRoutes');
app.use('/api/board-reports', boardReportRoutes);

const serviceRoutes = require('./routes/serviceRoutes');
app.use('/api/services', serviceRoutes);

const earningRoutes = require('./routes/earningRoutes');
app.use('/api/earnings', earningRoutes);

const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const voiceRoutes = require('./routes/voiceRoutes');
app.use('/api/voice', voiceRoutes);

// Serve the uploads folder statically so the React Native App can display the images via URL
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'Mobile Backend is running!' });
});

// Database Connection & Server Start
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Sync models (force: false to avoid data loss)
        await sequelize.sync({ force: false, alter: true });
        await ensureMobileServiceCatalog();

        app.listen(PORT, () => {
            console.log(`Mobile Backend running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
