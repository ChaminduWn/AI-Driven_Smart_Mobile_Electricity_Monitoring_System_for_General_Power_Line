const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const weatherRoutes = require('./routes/weatherRoutes');
const safetyRoutes = require('./routes/safetyRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/weather', weatherRoutes);
app.use('/api/safety', safetyRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Member4 Safety Assistant API is running',
    timestamp: new Date().toISOString(),
    component: 'Electricity Safety Assistant',
    author: 'Gamage K.P (IT22202390)'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ status: 'error', message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`Member4 Safety Assistant listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log('API endpoints:');
  console.log(` - Health: GET http://localhost:${PORT}/api/health`);
  console.log(` - Weather: GET http://localhost:${PORT}/api/weather`);
  console.log(` - Safety: GET http://localhost:${PORT}/api/safety`);
});

module.exports = app;
