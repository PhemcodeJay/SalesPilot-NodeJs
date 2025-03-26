const PageAccessController = require('./controllers/pageAccessController');

async function test() {
  try {
    // Create a record
    const newRecord = await PageAccessController.createPageAccessRecord({
      page: 'dashboard',
      required_access_level: 'business',
    });
    console.log('✅ Created Page Access:', newRecord.toJSON());

    // Get all records
    const allRecords = await PageAccessController.getAllPageAccessRecords();
    console.log('📋 All Page Access Records:', allRecords.map(r => r.toJSON()));

    // Get by ID
    const record = await PageAccessController.getPageAccessById(newRecord.id);
    console.log('🔍 Retrieved:', record.toJSON());

    // Update record
    const updated = await PageAccessController.updatePageAccess(newRecord.id, {
      required_access_level: 'enterprise',
    });
    console.log('✏️ Updated Record:', updated.toJSON());

    // Delete record
    const deleted = await PageAccessController.deletePageAccess(newRecord.id);
    console.log(deleted ? '🗑️ Record Deleted' : '❌ Deletion Failed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
