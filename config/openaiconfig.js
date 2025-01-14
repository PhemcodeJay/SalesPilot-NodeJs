const { OpenAIApi, Configuration } = require('openai');

// Initialize OpenAI API configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create an instance of OpenAIApi
const openai = new OpenAIApi(configuration);

module.exports = { openai };
