require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

async function migrateTripsRevenue() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = process.env.APPWRITE_DATABASE_ID || 'transitops';

  try {
    console.log('Starting Migration for Phase 7 (Trips Revenue)...');

    // Add revenue field to trips
    try {
      await databases.createFloatAttribute(dbId, 'trips', 'revenue', false); // optional for backward compatibility
      console.log('Attribute revenue created in trips.');
    } catch (e) {
      if (e.code === 409) console.log('Attribute revenue already exists in trips.');
      else console.error('Failed to create revenue in trips:', e.message);
    }

    console.log('Migration complete. Please wait ~5 seconds for attributes to be available in Appwrite.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateTripsRevenue();
