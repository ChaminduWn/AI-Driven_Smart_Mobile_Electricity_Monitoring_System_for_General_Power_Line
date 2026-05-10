const Service = require('../models/Service');
const mobileServiceCatalog = require('../data/mobileServiceCatalog');

async function ensureMobileServiceCatalog() {
    const existingServices = await Service.findAll();

    if (!existingServices.length) {
        await Service.bulkCreate(mobileServiceCatalog);
        return;
    }

    const existingByServiceId = new Map(existingServices.map((service) => [service.serviceId, service]));

    for (const item of mobileServiceCatalog) {
        const existing = existingByServiceId.get(item.serviceId);

        if (!existing) {
            await Service.create(item);
            continue;
        }

        let changed = false;
        ['category', 'categoryKey', 'name', 'description', 'displayOrder'].forEach((field) => {
            if (existing[field] !== item[field]) {
                existing[field] = item[field];
                changed = true;
            }
        });

        if (existing.basePrice === null || existing.basePrice === undefined) {
            existing.basePrice = item.basePrice;
            changed = true;
        }

        if (existing.isActive === null || existing.isActive === undefined) {
            existing.isActive = item.isActive;
            changed = true;
        }

        if (changed) {
            await existing.save();
        }
    }
}

module.exports = {
    ensureMobileServiceCatalog,
};
