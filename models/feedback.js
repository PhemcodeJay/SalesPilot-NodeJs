const { models } = require("../config/db.js"); // Import models from centralized db.js

const Feedback = models.Feedback; // Use the centralized Feedback model

// Sync model with database (Creates table if not exists)
const syncFeedbackTable = async () => {
  try {
    await Feedback.sync(); // Sync the Feedback table
    console.log("✅ Feedbacks table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating Feedbacks table:", error.message);
    throw new Error("Failed to sync Feedbacks table.");
  }
};

// CRUD Operations

// Get all feedback
const getAllFeedbacks = async () => {
  try {
    return await Feedback.findAll(); // Fetch all feedback records
  } catch (error) {
    console.error("❌ Error fetching feedback:", error.message);
    throw new Error("Failed to fetch feedback.");
  }
};

// Get feedback by ID
const getFeedbackById = async (feedbackId) => {
  try {
    return await Feedback.findOne({ where: { id: feedbackId } }); // Fetch feedback by ID
  } catch (error) {
    console.error("❌ Error fetching feedback by ID:", error.message);
    throw new Error("Failed to fetch feedback by ID.");
  }
};

// Create a new feedback
const createFeedback = async (feedbackData) => {
  try {
    const feedback = await Feedback.create(feedbackData); // Create new feedback record
    console.log(`✅ Feedback created by: ${feedback.name}`);
    return feedback;
  } catch (error) {
    console.error("❌ Error creating feedback:", error.message);
    throw new Error("Failed to create feedback.");
  }
};

// Update an existing feedback
const updateFeedback = async (feedbackId, updatedData) => {
  try {
    const feedback = await Feedback.findOne({ where: { id: feedbackId } });
    if (!feedback) throw new Error("Feedback not found."); // Check if feedback exists

    await feedback.update(updatedData); // Update feedback record
    console.log(`✅ Feedback updated by: ${feedback.name}`);
    return feedback;
  } catch (error) {
    console.error("❌ Error updating feedback:", error.message);
    throw new Error("Failed to update feedback.");
  }
};

// Delete a feedback
const deleteFeedback = async (feedbackId) => {
  try {
    const feedback = await Feedback.findOne({ where: { id: feedbackId } });
    if (!feedback) throw new Error("Feedback not found."); // Check if feedback exists

    await feedback.destroy(); // Delete feedback record
    console.log(`✅ Feedback deleted: ${feedback.name}`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting feedback:", error.message);
    throw new Error("Failed to delete feedback.");
  }
};

// Export methods and sync
module.exports = {
  syncFeedbackTable,
  getAllFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
