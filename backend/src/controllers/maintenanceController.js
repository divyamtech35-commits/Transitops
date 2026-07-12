const { Client, Databases, Query, ID } = require('node-appwrite');

const getDbClient = () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  return new Databases(client);
};

const DB_ID = process.env.APPWRITE_DATABASE_ID || 'transitops';
const MAINT_COLL = 'maintenancelogs';
const VEHICLES_COLL = 'vehicles';

const getMaintenanceLogs = async (req, res) => {
  try {
    const db = getDbClient();
    const { vehicle_id, status } = req.query;
    
    const queries = [];
    if (vehicle_id) queries.push(Query.equal('vehicleId', vehicle_id));
    if (status) queries.push(Query.equal('status', status));

    // Sort newest first, with high limit
    queries.push(Query.limit(100));
    queries.push(Query.orderDesc('$createdAt'));

    const response = await db.listDocuments(DB_ID, MAINT_COLL, queries);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createMaintenanceLog = async (req, res) => {
  const db = getDbClient();
  const { vehicleId, description } = req.body;

  try {
    // 1. Validate Vehicle Status
    const vehicle = await db.getDocument(DB_ID, VEHICLES_COLL, vehicleId);
    
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ error: 'Cannot send a vehicle to maintenance while it is On Trip.' });
    }
    if (vehicle.status === 'In Shop') {
      return res.status(400).json({ error: 'Vehicle is already In Shop.' });
    }
    if (vehicle.status === 'Retired') {
      return res.status(400).json({ error: 'Vehicle is Retired and cannot be sent to maintenance.' });
    }
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ error: `Vehicle must be Available to enter maintenance. Current status: ${vehicle.status}` });
    }

    // 2. Prevent Duplicate Open Maintenance Logs
    const openLogs = await db.listDocuments(DB_ID, MAINT_COLL, [
      Query.equal('vehicleId', vehicleId),
      Query.equal('status', 'Open')
    ]);

    if (openLogs.total > 0) {
      return res.status(400).json({ error: 'Vehicle already has an active (Open) maintenance log.' });
    }

    // 3. Application-Level Transaction
    // Create Log -> Update Vehicle

    const payload = {
      vehicleId,
      description,
      cost: 0, // Schema requires a float cost. We start at 0.
      status: 'Open',
      openedAt: new Date().toISOString()
    };

    const log = await db.createDocument(DB_ID, MAINT_COLL, ID.unique(), payload);

    try {
      await db.updateDocument(DB_ID, VEHICLES_COLL, vehicleId, { status: 'In Shop' });
    } catch (vehErr) {
      // Rollback: delete the newly created log if vehicle update fails
      await db.deleteDocument(DB_ID, MAINT_COLL, log.$id);
      throw vehErr;
    }

    res.status(201).json({ message: 'Maintenance log created successfully', log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const closeMaintenanceLog = async (req, res) => {
  const db = getDbClient();
  const logId = req.params.id;
  const { cost } = req.body;

  try {
    // Validate Log Status
    const log = await db.getDocument(DB_ID, MAINT_COLL, logId);
    
    if (log.status !== 'Open') {
      return res.status(400).json({ error: `Maintenance log is already ${log.status}.` });
    }

    // Validate Cost
    if (cost === undefined || cost === null || isNaN(cost) || parseFloat(cost) < 0) {
      return res.status(400).json({ error: 'A valid non-negative cost must be provided to close the maintenance log.' });
    }

    // Check Vehicle Status (in case it was manually retired while in shop)
    const vehicle = await db.getDocument(DB_ID, VEHICLES_COLL, log.vehicleId);

    // Application-Level Transaction
    // Update Log -> Update Vehicle

    const updatedLog = await db.updateDocument(DB_ID, MAINT_COLL, logId, {
      status: 'Closed',
      cost: parseFloat(cost),
      closedAt: new Date().toISOString()
    });

    try {
      // Only restore to Available if it wasn't manually marked as Retired while in the shop
      if (vehicle.status !== 'Retired') {
        await db.updateDocument(DB_ID, VEHICLES_COLL, log.vehicleId, { status: 'Available' });
      }
    } catch (vehErr) {
      // Rollback: revert the log back to Open
      await db.updateDocument(DB_ID, MAINT_COLL, logId, {
        status: 'Open',
        cost: 0,
        closedAt: null
      });
      throw vehErr;
    }

    res.json({ message: 'Maintenance log closed successfully', log: updatedLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMaintenanceLogs,
  createMaintenanceLog,
  closeMaintenanceLog
};
