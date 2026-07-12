require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

async function migrateTrips() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = process.env.APPWRITE_DATABASE_ID || 'transitops';
  const collectionId = 'trips';

  try {
    console.log('Adding new attributes to Trips collection...');

    const createAttr = async (fn, ...args) => {
      try {
        await databases[fn](dbId, collectionId, ...args);
        console.log(`Attribute ${args[0]} created.`);
      } catch (e) {
        if (e.code === 409) console.log(`Attribute ${args[0]} already exists.`);
        else console.error(`Failed to create ${args[0]}:`, e.message);
      }
    };

    await createAttr('createDatetimeAttribute', 'dispatchedAt', false);
    await createAttr('createDatetimeAttribute', 'completedAt', false);
    await createAttr('createDatetimeAttribute', 'cancelledAt', false);
    await createAttr('createDatetimeAttribute', 'plannedStartTime', false);

    await createAttr('createFloatAttribute', 'initialOdometer', false);
    await createAttr('createFloatAttribute', 'finalOdometer', false);
    await createAttr('createFloatAttribute', 'fuelConsumed', false);
    await createAttr('createFloatAttribute', 'actualDistance', false);

    console.log('Migration complete. Please wait ~5 seconds for attributes to be available in Appwrite.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateTrips();
