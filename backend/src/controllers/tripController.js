const { Client, Databases, Query, ID } = require('node-appwrite');

const getDbClient = () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  return new Databases(client);
};

const DB_ID = process.env.APPWRITE_DATABASE_ID || 'transitops';
const TRIPS_COLL = 'trips';
const VEHICLES_COLL = 'vehicles';
const DRIVERS_COLL = 'drivers';

const getTrips = async (req, res) => {
  try {
    const db = getDbClient();
    const { status } = req.query;
    
    const queries = [];
    if (status) queries.push(Query.equal('status', status));

    const response = await db.listDocuments(DB_ID, TRIPS_COLL, queries);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTrip = async (req, res) => {
  try {
    const db = getDbClient();
    const { vehicleId, driverId, cargoWeight, plannedDistance, source, destination, plannedStartTime } = req.body;

    // 1. Fetch Vehicle and Driver
    const vehicle = await db.getDocument(DB_ID, VEHICLES_COLL, vehicleId);
    const driver = await db.getDocument(DB_ID, DRIVERS_COLL, driverId);

    // 2. Validate Vehicle
    if (vehicle.status === 'In Shop' || vehicle.status === 'Retired') {
      return res.status(400).json({ error: `Vehicle is ${vehicle.status} and cannot be assigned.` });
    }
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ error: 'Vehicle is not currently available.' });
    }
    if (parseFloat(cargoWeight) > vehicle.maxLoad) {
      return res.status(400).json({ error: `Cargo weight exceeds vehicle max load of ${vehicle.maxLoad}kg.` });
    }

    // 3. Validate Driver
    if (driver.status === 'Suspended' || driver.status === 'Removed') {
      return res.status(400).json({ error: 'Driver is suspended or removed.' });
    }
    if (driver.status !== 'Available') {
      return res.status(400).json({ error: 'Driver is not currently available.' });
    }
    const expiry = new Date(driver.licenseExpiryDate);
    if (expiry <= new Date()) {
      return res.status(400).json({ error: 'Driver license has expired.' });
    }

    // 4. Create Trip
    const payload = {
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeight: parseFloat(cargoWeight),
      distance: parseFloat(plannedDistance), // mapped to distance per setup script
      status: 'Draft',
      plannedStartTime: plannedStartTime || new Date().toISOString()
    };
    
    const trip = await db.createDocument(DB_ID, TRIPS_COLL, ID.unique(), payload);
    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const dispatchTrip = async (req, res) => {
  const db = getDbClient();
  const tripId = req.params.id;

  try {
    const trip = await db.getDocument(DB_ID, TRIPS_COLL, tripId);
    
    if (trip.status !== 'Draft') {
      return res.status(400).json({ error: 'Only Draft trips can be dispatched.' });
    }

    // Check again before dispatch
    const vehicle = await db.getDocument(DB_ID, VEHICLES_COLL, trip.vehicleId);
    const driver = await db.getDocument(DB_ID, DRIVERS_COLL, trip.driverId);

    if (vehicle.status !== 'Available') {
      return res.status(400).json({ error: 'Vehicle is no longer available for dispatch.' });
    }
    if (driver.status !== 'Available') {
      return res.status(400).json({ error: 'Driver is no longer available for dispatch.' });
    }
    
    // Application-Level Transaction
    // Update Trip -> Vehicle -> Driver
    
    const updatedTrip = await db.updateDocument(DB_ID, TRIPS_COLL, tripId, {
      status: 'Dispatched',
      dispatchedAt: new Date().toISOString(),
      initialOdometer: vehicle.odometer
    });

    try {
      await db.updateDocument(DB_ID, VEHICLES_COLL, trip.vehicleId, { status: 'On Trip' });
      
      try {
        await db.updateDocument(DB_ID, DRIVERS_COLL, trip.driverId, { status: 'On Trip' });
      } catch (driverErr) {
        // Rollback Vehicle and Trip
        await db.updateDocument(DB_ID, VEHICLES_COLL, trip.vehicleId, { status: 'Available' });
        await db.updateDocument(DB_ID, TRIPS_COLL, tripId, { status: 'Draft' });
        throw driverErr;
      }
    } catch (vehicleErr) {
      // Rollback Trip
      await db.updateDocument(DB_ID, TRIPS_COLL, tripId, { status: 'Draft' });
      throw vehicleErr;
    }

    res.json({ message: 'Trip dispatched successfully', trip: updatedTrip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const completeTrip = async (req, res) => {
  const db = getDbClient();
  const tripId = req.params.id;
  const { finalOdometer, fuelConsumed, revenue } = req.body;

  if (finalOdometer === undefined) {
    return res.status(400).json({ error: 'finalOdometer is required to complete a trip.' });
  }

  try {
    const trip = await db.getDocument(DB_ID, TRIPS_COLL, tripId);
    
    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ error: 'Only Dispatched trips can be completed.' });
    }

    // Application-Level Transaction
    // Update Trip -> Vehicle -> Driver
    
    const actualDistance = parseFloat(finalOdometer) - trip.initialOdometer;

    const updatedTrip = await db.updateDocument(DB_ID, TRIPS_COLL, tripId, {
      status: 'Completed',
      completedAt: new Date().toISOString(),
      finalOdometer: parseFloat(finalOdometer),
      fuelConsumed: fuelConsumed ? parseFloat(fuelConsumed) : null,
      revenue: revenue ? parseFloat(revenue) : 0,
      actualDistance: actualDistance > 0 ? actualDistance : 0
    });

    try {
      await db.updateDocument(DB_ID, VEHICLES_COLL, trip.vehicleId, { 
        status: 'Available',
        odometer: parseFloat(finalOdometer)
      });
      
      try {
        await db.updateDocument(DB_ID, DRIVERS_COLL, trip.driverId, { status: 'Available' });
      } catch (driverErr) {
        // Warning: Partial completion failure. Manual intervention might be needed for Driver.
        console.error('Failed to update driver status to Available on trip completion:', driverErr);
      }
    } catch (vehicleErr) {
      // Warning: Partial completion failure. Manual intervention might be needed.
      console.error('Failed to update vehicle status to Available on trip completion:', vehicleErr);
    }

    res.json({ message: 'Trip completed successfully', trip: updatedTrip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const cancelTrip = async (req, res) => {
  const db = getDbClient();
  const tripId = req.params.id;

  try {
    const trip = await db.getDocument(DB_ID, TRIPS_COLL, tripId);
    
    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      return res.status(400).json({ error: `Cannot cancel a trip that is ${trip.status}.` });
    }

    const wasDispatched = trip.status === 'Dispatched';

    const updatedTrip = await db.updateDocument(DB_ID, TRIPS_COLL, tripId, {
      status: 'Cancelled',
      cancelledAt: new Date().toISOString()
    });

    if (wasDispatched) {
      // If it was already dispatched, we must revert vehicle and driver statuses
      try {
        await db.updateDocument(DB_ID, VEHICLES_COLL, trip.vehicleId, { status: 'Available' });
        await db.updateDocument(DB_ID, DRIVERS_COLL, trip.driverId, { status: 'Available' });
      } catch (err) {
        console.error('Failed to revert vehicle/driver status on cancel:', err);
      }
    }

    res.json({ message: 'Trip cancelled successfully', trip: updatedTrip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTrips,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip
};
