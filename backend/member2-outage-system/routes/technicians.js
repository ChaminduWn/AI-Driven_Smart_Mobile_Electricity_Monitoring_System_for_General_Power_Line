import express from 'express';
import Technician from '../models/Technician.js';
import Outage from '../models/Outage.js';
import { Op } from 'sequelize';

const router = express.Router();

export default function technicianRoutes(io) {
  // Get all technicians
  router.get('/', async (req, res) => {
    try {
      const technicians = await Technician.findAll({
        order: [['name', 'ASC']]
      });

      // Format for frontend
      const formatted = technicians.map(tech => ({
        id: tech.id,
        technicianId: tech.technicianId,
        name: tech.name,
        phone: tech.phone,
        attendanceStatus: tech.attendanceStatus,
        availability: tech.availability,
        currentTask: tech.currentTaskId,
        latitude: tech.latitude ? parseFloat(tech.latitude) : null,
        longitude: tech.longitude ? parseFloat(tech.longitude) : null,
        vehicle: tech.vehicleNumber ? {
          number: tech.vehicleNumber,
          type: tech.vehicleType,
          available: tech.vehicleAvailable
        } : null
      }));

      res.json(formatted);
    } catch (error) {
      console.error('Error fetching technicians:', error);
      res.status(500).json({ error: 'Failed to fetch technicians' });
    }
  });

  // Get technicians with vehicles
  router.get('/with-vehicles', async (req, res) => {
    try {
      const technicians = await Technician.findAll({
        where: {
          vehicleNumber: { [Op.ne]: null }
        },
        order: [['name', 'ASC']]
      });

      const formatted = technicians.map(tech => ({
        id: tech.id,
        technicianId: tech.technicianId,
        name: tech.name,
        phone: tech.phone,
        attendanceStatus: tech.attendanceStatus,
        availability: tech.availability,
        currentTask: tech.currentTaskId,
        vehicle: {
          number: tech.vehicleNumber,
          type: tech.vehicleType,
          available: tech.vehicleAvailable
        }
      }));

      res.json(formatted);
    } catch (error) {
      console.error('Error fetching technicians:', error);
      res.status(500).json({ error: 'Failed to fetch technicians' });
    }
  });

  // Get nearest technician
  router.post('/nearest', async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      
      const technicians = await Technician.findAll({
        where: {
          availability: 'Available',
          attendanceStatus: 'Present',
          latitude: { [Op.ne]: null },
          longitude: { [Op.ne]: null }
        }
      });

      // Calculate distances and find nearest
      let nearest = null;
      let minDistance = Infinity;

      technicians.forEach(tech => {
        const lat1 = parseFloat(latitude);
        const lon1 = parseFloat(longitude);
        const lat2 = parseFloat(tech.latitude);
        const lon2 = parseFloat(tech.longitude);

        // Haversine formula
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        if (distance < minDistance) {
          minDistance = distance;
          nearest = tech;
        }
      });

      res.json({ technician: nearest, distance: minDistance });
    } catch (error) {
      console.error('Error finding nearest technician:', error);
      res.status(500).json({ error: 'Failed to find nearest technician' });
    }
  });

  // Update technician status
  router.patch('/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const technician = await Technician.findByPk(req.params.id);

      if (!technician) {
        return res.status(404).json({ error: 'Technician not found' });
      }

      technician.availability = status;
      await technician.save();

      // Emit real-time update
      io.to('technicians').emit('technician-updated', technician);

      res.json(technician);
    } catch (error) {
      console.error('Error updating technician:', error);
      res.status(500).json({ error: 'Failed to update technician' });
    }
  });

  return router;
}