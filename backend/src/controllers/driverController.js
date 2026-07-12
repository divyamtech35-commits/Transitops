const { Client, Databases, Query, ID } = require('node-appwrite');

const getDbClient = () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  return new Databases(client);
};

const DB_ID = process.env.APPWRITE_DATABASE_ID || 'transitops';
const COLLECTION = 'drivers';

const getDrivers = async (req, res) => {
  try {
    const db = getDbClient();
    const { status } = req.query;

    // Base query: exclude soft-deleted (Removed) drivers
    const queries = [
      Query.notEqual('status', 'Removed'),
      Query.limit(100),
      Query.orderDesc('$createdAt')
    ];

    if (status) queries.push(Query.equal('status', status));

    const response = await db.listDocuments(DB_ID, COLLECTION, queries);
    res.json(response);
  } catch (error) {
    console.error('getDrivers Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getDriverById = async (req, res) => {
  try {
    const db = getDbClient();
    const driver = await db.getDocument(DB_ID, COLLECTION, req.params.id);
    res.json(driver);
  } catch (error) {
    res.status(404).json({ error: 'Driver not found' });
  }
};

const createDriver = async (req, res) => {
  try {
    const db = getDbClient();
    const payload = {
      ...req.body,
      // Default to Available if not provided
      status: req.body.status || 'Available'
    };

    const driver = await db.createDocument(DB_ID, COLLECTION, ID.unique(), payload);
    res.status(201).json(driver);
  } catch (error) {
    console.error('createDriver Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateDriver = async (req, res) => {
  try {
    const db = getDbClient();
    const driver = await db.updateDocument(DB_ID, COLLECTION, req.params.id, req.body);
    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteDriver = async (req, res) => {
  try {
    const db = getDbClient();
    // Soft Delete Implementation: status -> Removed
    const driver = await db.updateDocument(DB_ID, COLLECTION, req.params.id, {
      status: 'Removed'
    });
    res.json({ message: 'Driver removed successfully', driver });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver
};
