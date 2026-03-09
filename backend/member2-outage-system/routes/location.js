import express from 'express';
import Technician from '../models/Technician.js';

const router = express.Router();

export default function locationRoutes(io) {
  // Update technician location
  router.post('/update', async (req, res) => {
    try {
      const { technicianId, latitude, longitude } = req.body;

      const technician = await Technician.findOne({
        where: { technicianId }
      });

      if (!technician) {
        return res.status(404).json({ error: 'Technician not found' });
      }

      technician.latitude = latitude;
      technician.longitude = longitude;
      await technician.save();

      // Emit real-time location update
      io.to('technicians').emit('location-updated', {
        technicianId: technician.id,
        latitude,
        longitude
      });

      res.json(technician);
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  });

  return router;
}