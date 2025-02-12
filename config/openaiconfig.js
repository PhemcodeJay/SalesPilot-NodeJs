const { Configuration, OpenAIApi } = require('openai');

// Initialize OpenAI API configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create an OpenAIApi instance
const openai = new OpenAIApi(configuration);

async function main() {
  try {
    const chatCompletion = await openai.createChatCompletion({
      model: 'gpt-4', // Corrected model name
      messages: [{ role: 'user', content: 'Say this is a test' }],
    });

    console.log('Chat Completion:', chatCompletion.data.choices[0].message.content);
  } catch (error) {
    console.error('Error with OpenAI API:', error.response?.data || error.message);
  }
}

main();

module.exports = { openai };