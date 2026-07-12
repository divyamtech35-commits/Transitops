require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

async function setupAppwrite() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = process.env.APPWRITE_DATABASE_ID || 'transitops';

  try {
    console.log(`Setting up Appwrite Database: ${dbId}`);
    
    // Check if database exists, if not create it
    try {
      await databases.get(dbId);
      console.log('Database already exists.');
    } catch (err) {
      if (err.code === 404) {
        await databases.create(dbId, 'TransitOps DB');
        console.log('Database created successfully.');
      } else {
        throw err;
      }
    }

    // Function to create collection if it doesn't exist
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

    // Helper to wait
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // --- VEHICLES ---
    const isNewVehicles = await createCollection('vehicles', 'Vehicles');
    if (isNewVehicles) {
      await databases.createStringAttribute(dbId, 'vehicles', 'registrationNumber', 50, true);
      await databases.createStringAttribute(dbId, 'vehicles', 'model', 100, true);
      await databases.createStringAttribute(dbId, 'vehicles', 'type', 50, true);
      await databases.createIntegerAttribute(dbId, 'vehicles', 'maxLoad', true);
      await databases.createFloatAttribute(dbId, 'vehicles', 'odometer', true);
      await databases.createFloatAttribute(dbId, 'vehicles', 'acquisitionCost', true);
      await databases.createStringAttribute(dbId, 'vehicles', 'status', 50, true);
      
      console.log('Waiting for Vehicles attributes to be available...');
      await delay(3000);
      try {
        await databases.createIndex(dbId, 'vehicles', 'idx_registration', 'unique', ['registrationNumber'], ['ASC']);
        console.log('Vehicles unique index created.');
      } catch (err) {
        console.log('Error creating index on vehicles:', err.message);
      }
    }

    // --- DRIVERS ---
    const isNewDrivers = await createCollection('drivers', 'Drivers');
    if (isNewDrivers) {
      await databases.createStringAttribute(dbId, 'drivers', 'name', 100, true);
      await databases.createStringAttribute(dbId, 'drivers', 'licenseNumber', 100, true);
      await databases.createStringAttribute(dbId, 'drivers', 'licenseCategory', 50, true);
      await databases.createDatetimeAttribute(dbId, 'drivers', 'licenseExpiryDate', true);
      await databases.createStringAttribute(dbId, 'drivers', 'contactNumber', 50, true);
      await databases.createFloatAttribute(dbId, 'drivers', 'safetyScore', true);
      await databases.createStringAttribute(dbId, 'drivers', 'status', 50, true);
      console.log('Drivers collection configured.');
    }

    // --- TRIPS ---
    const isNewTrips = await createCollection('trips', 'Trips');
    if (isNewTrips) {
      await databases.createStringAttribute(dbId, 'trips', 'source', 255, true);
      await databases.createStringAttribute(dbId, 'trips', 'destination', 255, true);
      await databases.createStringAttribute(dbId, 'trips', 'vehicleId', 50, true);
      await databases.createStringAttribute(dbId, 'trips', 'driverId', 50, true);
      await databases.createFloatAttribute(dbId, 'trips', 'cargoWeight', true);
      await databases.createFloatAttribute(dbId, 'trips', 'distance', true);
      await databases.createStringAttribute(dbId, 'trips', 'status', 50, true);
      console.log('Trips collection configured.');
    }

    // --- MAINTENANCE LOGS ---
    const isNewMaintenance = await createCollection('maintenancelogs', 'Maintenance Logs');
    if (isNewMaintenance) {
      await databases.createStringAttribute(dbId, 'maintenancelogs', 'vehicleId', 50, true);
      await databases.createStringAttribute(dbId, 'maintenancelogs', 'description', 1000, true);
      await databases.createFloatAttribute(dbId, 'maintenancelogs', 'cost', true);
      await databases.createStringAttribute(dbId, 'maintenancelogs', 'status', 50, true);
      console.log('MaintenanceLogs collection configured.');
    }

    // --- EXPENSES ---
    const isNewExpenses = await createCollection('expenses', 'Expenses');
    if (isNewExpenses) {
      await databases.createStringAttribute(dbId, 'expenses', 'vehicleId', 50, true);
      await databases.createStringAttribute(dbId, 'expenses', 'type', 50, true);
      await databases.createFloatAttribute(dbId, 'expenses', 'liters', false);
      await databases.createFloatAttribute(dbId, 'expenses', 'cost', true);
      await databases.createDatetimeAttribute(dbId, 'expenses', 'date', true);
      console.log('Expenses collection configured.');
    }

    console.log('Setup complete!');
  } catch (error) {
    console.error('Error during setup:', error);
  }
}

setupAppwrite();
