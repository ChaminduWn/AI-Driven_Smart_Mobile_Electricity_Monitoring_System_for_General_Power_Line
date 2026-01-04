import express from 'express';
import Outage from '../models/Outage.js';
import Technician from '../models/Technician.js';
import Assignment from '../models/Assignment.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

export default function outageRoutes(io) {
  // Get all outages
  router.get('/', async (req, res) => {
    try {
      const { district, status, priority } = req.query;
      const where = {};
      
      if (district) where.district = district;
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const outages = await Outage.findAll({
        where,
        order: [['reportedAt', 'DESC']],
        include: [{
          model: Technician,
          as: 'assignedTechnicians',
          through: { attributes: [] }
        }]
      });

      res.json(outages);
    } catch (error) {
      console.error('Error fetching outages:', error);
      res.status(500).json({ error: 'Failed to fetch outages' });
    }
  });

  // Get single outage by ID
  router.get('/:id', async (req, res) => {
    try {
      const outage = await Outage.findByPk(req.params.id, {
        include: [{
          model: Technician,
          as: 'assignedTechnicians',
          through: { attributes: [] }
        }]
      });

      if (!outage) {
        return res.status(404).json({ error: 'Outage not found' });
      }

      // Format response for frontend
      const formattedOutage = {
        id: outage.id,
        issueId: outage.issueId,
        status: outage.status,
        priority: outage.priority,
        location: {
          address: outage.address,
          district: outage.district,
          area: outage.area,
          feeder: outage.feeder,
          transformer: outage.transformer,
          coordinates: {
            lat: parseFloat(outage.latitude),
            lng: parseFloat(outage.longitude)
          }
        },
        reporter: {
          name: outage.reporterName,
          phone: outage.reporterPhone,
          type: outage.reportedBy
        },
        description: outage.description,
        reportedAt: outage.reportedAt,
        updatedAt: outage.updatedAt,
        assignedTechnicians: outage.assignedTechnicians || []
      };

      res.json(formattedOutage);
    } catch (error) {
      console.error('Error fetching outage:', error);
      res.status(500).json({ error: 'Failed to fetch outage' });
    }
  });

  // Report new outage
  router.post('/report', [
    body('latitude').isFloat(),
    body('longitude').isFloat(),
    body('reportedBy').isIn(['Technician', 'Householder'])
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { latitude, longitude, address, district, area, feeder, transformer, description, reportedBy, reporterName, reporterPhone, priority } = req.body;

      // Generate issue ID
      const issueId = `CEB-${Date.now()}`;

      const outage = await Outage.create({
        issueId,
        latitude,
        longitude,
        address,
        district,
        area,
        feeder,
        transformer,
        description,
        reportedBy,
        reporterName,
        reporterPhone,
        priority: priority || 'Medium',
        status: 'Open'
      });

      // Emit real-time update
      io.to('outages').emit('new-outage', outage);

      res.status(201).json(outage);
    } catch (error) {
      console.error('Error creating outage:', error);
      res.status(500).json({ error: 'Failed to create outage' });
    }
  });

  // Update outage status
  router.patch('/:id', async (req, res) => {
    try {
      const { status } = req.body;
      const outage = await Outage.findByPk(req.params.id);

      if (!outage) {
        return res.status(404).json({ error: 'Outage not found' });
      }

      outage.status = status;
      outage.updatedAt = new Date();
      await outage.save();

      // Emit real-time update
      io.to('outages').emit('outage-updated', outage);

      res.json(outage);
    } catch (error) {
      console.error('Error updating outage:', error);
      res.status(500).json({ error: 'Failed to update outage' });
    }
  });

  // Assign technician team
  router.post('/:id/assign-team', async (req, res) => {
    try {
      const { technicianIds, vehicles } = req.body;
      const outage = await Outage.findByPk(req.params.id);

      if (!outage) {
        return res.status(404).json({ error: 'Outage not found' });
      }

      // Create assignments
      const assignments = await Promise.all(
        technicianIds.map(async (techId) => {
          const assignment = await Assignment.create({
            outageId: outage.id,
            technicianId: techId,
            assignedBy: 'admin'
          });

          // Update technician status
          const technician = await Technician.findByPk(techId);
          if (technician) {
            technician.availability = 'On Task';
            technician.currentTaskId = outage.id;
            await technician.save();
          }

          return assignment;
        })
      );

      // Update outage
      outage.status = 'Assigned';
      outage.assignedTechnicianIds = technicianIds;
      outage.updatedAt = new Date();
      await outage.save();

      // Load assigned technicians for response
      const assignedTechnicians = await Technician.findAll({
        where: { id: technicianIds }
      });

      // Emit real-time updates
      io.to('outages').emit('outage-assigned', { outage, technicians: assignedTechnicians });
      io.to('technicians').emit('technicians-updated', assignedTechnicians);

      res.json({
        outage,
        assignments,
        technicians: assignedTechnicians
      });
    } catch (error) {
      console.error('Error assigning technicians:', error);
      res.status(500).json({ error: 'Failed to assign technicians' });
    }
  });

  // Get district-wise summary
router.get('/summary/districts', async (req, res) => {
    try {
      const outages = await Outage.findAll({
        attributes: ['district', 'reportedBy', 'reportedAt'],
        order: [['reportedAt', 'DESC']]
      });
  
      // Group by district
      const summary = {};
      outages.forEach(outage => {
        const district = outage.district || 'Unknown';
        if (!summary[district]) {
          summary[district] = {
            district,
            technicianReports: 0,
            householderReports: 0,
            latestDate: null
          };
        }
  
        if (outage.reportedBy === 'Technician') {
          summary[district].technicianReports++;
        } else if (outage.reportedBy === 'Householder') {
          summary[district].householderReports++;
        }
  
        const reportDate = new Date(outage.reportedAt);
        if (!summary[district].latestDate || reportDate > summary[district].latestDate) {
          summary[district].latestDate = reportDate;
        }
      });
  
      const result = Object.values(summary).sort((a, b) => 
        (b.technicianReports + b.householderReports) - (a.technicianReports + a.householderReports)
      );
  
      res.json(result);
    } catch (error) {
      console.error('Error fetching district summary:', error);
      res.status(500).json({ error: 'Failed to fetch district summary' });
    }
  });

  return router;
}