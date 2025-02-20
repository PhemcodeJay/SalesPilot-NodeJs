const express = require("express");
const session = require("express-session");
const csrfMiddleware = require("./csrftmiddleware"); // Import CSRF middleware

const app = express();

// Middleware Setup
app.use(session({
  secret: "your_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === "production" }
}));

// Apply CSRF Middleware
csrfMiddleware(app);


// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong!");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
