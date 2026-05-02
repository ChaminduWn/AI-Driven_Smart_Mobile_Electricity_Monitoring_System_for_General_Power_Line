const express = require('express');
const app = express();
const adminRoutes = require('./routes/adminRoutes');

app.use(express.json());
app.use('/api/admin', adminRoutes);

app.listen(8004, () => {
    console.log('Test Server on 8004');
    const http = require('http');
    http.get('http://localhost:8004/api/admin/dashboard', (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
            console.log('RESPONSE:', data);
            process.exit(0);
        });
    });
});
