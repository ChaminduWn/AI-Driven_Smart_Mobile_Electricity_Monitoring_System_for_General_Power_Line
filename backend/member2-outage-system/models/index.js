import Outage from './Outage.js';
import Technician from './Technician.js';
import Assignment from './Assignment.js';

// Define associations
Outage.belongsToMany(Technician, {
  through: Assignment,
  foreignKey: 'outageId',
  otherKey: 'technicianId',
  as: 'assignedTechnicians'
});

Technician.belongsToMany(Outage, {
  through: Assignment,
  foreignKey: 'technicianId',
  otherKey: 'outageId',
  as: 'assignedOutages'
});

Assignment.belongsTo(Outage, { foreignKey: 'outageId' });
Assignment.belongsTo(Technician, { foreignKey: 'technicianId' });

export { Outage, Technician, Assignment };