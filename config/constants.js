// Load public routes from environment variable or set default ones
const publicRoutes = process.env.PUBLIC_ROUTES
  ? process.env.PUBLIC_ROUTES.split(',').map(route => route.trim())
  : ["/", "/login", "/signup", "/index", "/passwordreset", "/recoverpwd", "/activate"];

module.exports = Object.freeze({
  publicRoutes
});
