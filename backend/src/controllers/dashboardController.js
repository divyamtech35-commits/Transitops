const { Client, Databases, Query } = require('node-appwrite');

const getDbClient = () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  return new Databases(client);
};

const DB_ID = process.env.APPWRITE_DATABASE_ID || 'transitops';
const VEHICLES_COLL = 'vehicles';
const DRIVERS_COLL = 'drivers';
const TRIPS_COLL = 'trips';

const getDashboardKpis = async (req, res) => {
  try {
    const db = getDbClient();

    // 1. Fetch all active vehicles (exclude retired)
    const vehRes = await db.listDocuments(DB_ID, VEHICLES_COLL, [
      Query.notEqual('status', 'Retired'),
      Query.limit(100)
    ]);
    const vehicles = vehRes.documents || [];

    // 2. Fetch all active drivers (exclude removed)
    const drvRes = await db.listDocuments(DB_ID, DRIVERS_COLL, [
      Query.notEqual('status', 'Removed'),
      Query.limit(100)
    ]);
    const drivers = drvRes.documents || [];

    // 3. Fetch all trips
    const tripRes = await db.listDocuments(DB_ID, TRIPS_COLL, [
      Query.limit(100)
    ]);
    const trips = tripRes.documents || [];

    // Calculate metrics
    const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'In Shop').length;

    const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
    const pendingTrips = trips.filter(t => t.status === 'Draft').length;

    const driversOnDuty = drivers.filter(d => d.status === 'On Trip').length;

    const totalFleet = vehicles.length;
    const fleetUtilization = totalFleet > 0 ? Math.round((activeVehicles / totalFleet) * 100) : 0;

    res.json({
      activeVehicles,
      availableVehicles,
      maintenanceVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      vehicles,
      drivers,
      trips: trips.slice(0, 10) // return last 10 trips
    });
  } catch (error) {
    console.error('getDashboardKpis Error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardKpis
};
