// middleware/tenancyMiddleware.js

const tenants = {
    tenant1: { db: 'db_tenant1', secret: 'secret1' },
    tenant2: { db: 'db_tenant2', secret: 'secret2' },
    // Add more tenants as needed
};

const tenancyMiddleware = (req, res, next) => {
    const host = req.hostname;
    const tenantId = host.split('.')[0]; // Assuming the tenant ID is the subdomain (e.g. tenant1.domain.com)

    if (!tenants[tenantId]) {
        return res.status(404).json({ message: 'Tenant not found' });
    }

    req.tenant = tenants[tenantId]; // Attach tenant information to the request object
    next();
};

module.exports = tenancyMiddleware;
