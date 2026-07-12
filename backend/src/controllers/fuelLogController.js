const { Client, Databases, Query, ID } = require('node-appwrite');

const getDbClient = () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  return new Databases(client);
};

const DB_ID = process.env.APPWRITE_DATABASE_ID || 'transitops';
const FUEL_COLL = 'fuellogs';
const VEHICLES_COLL = 'vehicles';

const getFuelLogs = async (req, res) => {
  try {
    const db = getDbClient();
    const { vehicle_id } = req.query;
    
    const queries = [];
    if (vehicle_id) queries.push(Query.equal('vehicleId', vehicle_id));
    
    // Sort newest first with limit
    queries.push(Query.limit(100));
    queries.push(Query.orderDesc('$createdAt'));

    const response = await db.listDocuments(DB_ID, FUEL_COLL, queries);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createFuelLog = async (req, res) => {
  const db = getDbClient();
  const { vehicleId, liters, cost, date } = req.body;

  try {
    // 1. Validate Vehicle Existence (prevent orphaned records)
    try {
      await db.getDocument(DB_ID, VEHICLES_COLL, vehicleId);
    } catch (vehErr) {
      if (vehErr.code === 404) {
        return res.status(400).json({ error: 'Invalid Vehicle ID. Vehicle does not exist.' });
      }
      throw vehErr;
    }

    // 2. Validate Numbers
    if (isNaN(parseFloat(liters)) || parseFloat(liters) <= 0) {
      return res.status(400).json({ error: 'Liters must be a positive number.' });
    }
    if (isNaN(parseFloat(cost)) || parseFloat(cost) < 0) {
      return res.status(400).json({ error: 'Cost must be a valid non-negative number.' });
    }

    const payload = {
      vehicleId,
      liters: parseFloat(liters),
      cost: parseFloat(cost),
      date: date || new Date().toISOString()
    };

    const log = await db.createDocument(DB_ID, FUEL_COLL, ID.unique(), payload);

    res.status(201).json({ message: 'Fuel log created successfully', log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFuelLogs,
  createFuelLog
};
