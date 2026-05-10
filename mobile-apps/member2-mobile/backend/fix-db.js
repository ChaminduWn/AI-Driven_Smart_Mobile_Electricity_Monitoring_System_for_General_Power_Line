require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');

async function fixDb() {
    try {
        await sequelize.authenticate();
        console.log('DB connected');

        // Force sync to recreate the Users table
        await User.sync({ force: true });
        console.log('Users table recreated successfully');

        // Verify the table
        const desc = await sequelize.getQueryInterface().describeTable('Users');
        console.log('Table columns:', Object.keys(desc).join(', '));
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

fixDb();
