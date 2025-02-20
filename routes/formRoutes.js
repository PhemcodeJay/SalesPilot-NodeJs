const express = require("express");
const router = express.Router();

router.get("/form", (req, res) => {
  res.send(`
    <form action="/submit" method="POST">
      <input type="hidden" name="_csrf" value="${req.csrfToken()}">
      <input type="text" name="data" placeholder="Enter some data">
      <button type="submit">Submit</button>
    </form>
  `);
});

router.post("/submit", (req, res) => {
  res.send("Form submitted successfully!");
});

module.exports = router;
