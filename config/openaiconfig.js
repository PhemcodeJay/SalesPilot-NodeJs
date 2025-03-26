const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

// Ensure API key is provided
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OpenAI API key is missing. Please set OPENAI_API_KEY in your .env file.");
  process.exit(1);
}

// Initialize OpenAI API client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate AI response using OpenAI's GPT model.
 * @param {string} userMessage - The message from the user.
 * @param {string} model - The OpenAI model to use (default: gpt-4).
 * @returns {Promise<string>} - The AI-generated response.
 */
async function generateResponse(userMessage, model = "gpt-4") {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: userMessage }],
    });

    return response.choices[0]?.message?.content || "No response generated.";
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.response?.data || error.message);
    return "Error generating response.";
  }
}

// Example usage (Remove in production)
if (require.main === module) {
  (async () => {
    const testMessage = "Say this is a test";
    const response = await generateResponse(testMessage);
    console.log("AI Response:", response);
  })();
}

module.exports = { openai, generateResponse };
