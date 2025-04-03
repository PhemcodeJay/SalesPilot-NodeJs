// constants.js
const publicRoutes = process.env.PUBLIC_ROUTES
  ? process.env.PUBLIC_ROUTES.split(',').map(route => route.trim())
  : ["/", "/login", "/signup", "/index", "/passwordreset", "/recoverpwd", "/activate"];

module.exports = Object.freeze({
  publicRoutes: publicRoutes
});
