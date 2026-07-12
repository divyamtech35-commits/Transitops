require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

async function migrateFuelAndExpenses() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = process.env.APPWRITE_DATABASE_ID || 'transitops';

  try {
    console.log('Starting Migration for Phase 6 (Fuel Logs & Expenses)...');

    const createCollection = async (collectionId, name) => {
      try {
        await databases.getCollection(dbId, collectionId);
        console.log(`Collection ${name} already exists.`);
        return false;
      } catch (err) {
        if (err.code === 404) {
          await databases.createCollection(dbId, collectionId, name);
          console.log(`Collection ${name} created.`);
          return true;
        }
        throw err;
      }
    };

    const createAttr = async (collId, fn, ...args) => {
      try {
        await databases[fn](dbId, collId, ...args);
        console.log(`Attribute ${args[0]} created in ${collId}.`);
      } catch (e) {
        if (e.code === 409) console.log(`Attribute ${args[0]} already exists in ${collId}.`);
        else console.error(`Failed to create ${args[0]} in ${collId}:`, e.message);
      }
    };

    // 1. Create fuellogs collection
    const isNewFuel = await createCollection('fuellogs', 'Fuel Logs');
    if (isNewFuel) {
      await createAttr('fuellogs', 'createStringAttribute', 'vehicleId', 50, true);
      await createAttr('fuellogs', 'createFloatAttribute', 'liters', true);
      await createAttr('fuellogs', 'createFloatAttribute', 'cost', true);
      await createAttr('fuellogs', 'createDatetimeAttribute', 'date', true);
      console.log('Fuel Logs schema configured.');
    }

    // 2. Update expenses collection (add tripId)
    await createAttr('expenses', 'createStringAttribute', 'tripId', 50, false);
    await createAttr('expenses', 'createStringAttribute', 'description', 255, false);

    console.log('Migration complete. Please wait ~5 seconds for attributes to be available in Appwrite.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateFuelAndExpenses();
