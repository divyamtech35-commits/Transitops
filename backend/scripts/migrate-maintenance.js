require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

async function migrateMaintenance() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = process.env.APPWRITE_DATABASE_ID || 'transitops';
  const collectionId = 'maintenancelogs';

  try {
    console.log('Adding new attributes to Maintenance Logs collection...');

    const createAttr = async (fn, ...args) => {
      try {
        await databases[fn](dbId, collectionId, ...args);
        console.log(`Attribute ${args[0]} created.`);
      } catch (e) {
        if (e.code === 409) console.log(`Attribute ${args[0]} already exists.`);
        else console.error(`Failed to create ${args[0]}:`, e.message);
      }
    };

    await createAttr('createDatetimeAttribute', 'openedAt', false);
    await createAttr('createDatetimeAttribute', 'closedAt', false);

    console.log('Migration complete. Please wait ~5 seconds for attributes to be available in Appwrite.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateMaintenance();
