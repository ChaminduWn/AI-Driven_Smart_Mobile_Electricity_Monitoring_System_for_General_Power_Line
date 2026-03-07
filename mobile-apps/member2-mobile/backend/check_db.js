const User = require('./models/User');
const Job = require('./models/Job');

async function check() {
    try {
        const users = await User.count();
        const techs = await User.count({ where: { role: 'Electrician' } });
        const householders = await User.count({ where: { role: 'Householder' } });
        const jobs = await Job.count();
        console.log(`=========================`);
        console.log(`DB RECORD COUNT SUMMARY`);
        console.log(`=========================`);
        console.log(`Total Users in DB: ${users}`);
        console.log(`- Technicians: ${techs}`);
        console.log(`- Householders: ${householders}`);
        console.log(`Total Jobs: ${jobs}`);
        console.log(`=========================`);
    } catch (e) {
        console.error('Error connecting to DB:', e);
    } finally {
        process.exit();
    }
}

check();
