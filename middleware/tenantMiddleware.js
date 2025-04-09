const Tenant = require('../models/tenant');

const tenantMiddleware = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id']; // Tenant ID passed in the request header

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  try {
    // Fetch tenant information based on the tenant ID
    const tenant = await Tenant.findOne({ where: { id: tenantId } });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Attach tenant data to the request object
    req.tenant = tenant;
    next();
  } catch (err) {
    console.error('Tenant middleware error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = tenantMiddleware;
