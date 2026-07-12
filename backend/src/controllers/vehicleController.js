const { Client, Databases, Query, ID } = require('node-appwrite');

const getDbClient = () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  return new Databases(client);
};

const DB_ID = process.env.APPWRITE_DATABASE_ID || 'transitops';
const COLLECTION = 'vehicles';

const getVehicles = async (req, res) => {
  try {
    const db = getDbClient();
    const { status, type, region } = req.query;
    
    // Base query: exclude soft-deleted (Retired) vehicles
    const queries = [Query.notEqual('status', 'Retired')];
    
    if (status) queries.push(Query.equal('status', status));
    if (type) queries.push(Query.equal('type', type));
    // Region might not be in our basic schema, but we pass it anyway if it exists
    if (region) queries.push(Query.equal('region', region));

    const response = await db.listDocuments(DB_ID, COLLECTION, queries);
    res.json(response);
  } catch (error) {
    console.error('getVehicles Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const db = getDbClient();
    const vehicle = await db.getDocument(DB_ID, COLLECTION, req.params.id);
    res.json(vehicle);
  } catch (error) {
    res.status(404).json({ error: 'Vehicle not found' });
  }
};

const createVehicle = async (req, res) => {
  try {
    const db = getDbClient();
    // Validate unique registrationNumber natively via Appwrite index
    const payload = {
      ...req.body,
      // Default to Available if not provided
      status: req.body.status || 'Available'
    };
    
    const vehicle = await db.createDocument(DB_ID, COLLECTION, ID.unique(), payload);
    res.status(201).json(vehicle);
  } catch (error) {
    if (error.code === 409) {
      return res.status(409).json({ error: 'Registration number must be unique' });
    }
    console.error('createVehicle Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const db = getDbClient();
    const vehicle = await db.updateDocument(DB_ID, COLLECTION, req.params.id, req.body);
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const db = getDbClient();
    // Soft Delete Implementation
    const vehicle = await db.updateDocument(DB_ID, COLLECTION, req.params.id, {
      status: 'Retired'
    });
    res.json({ message: 'Vehicle retired successfully', vehicle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
