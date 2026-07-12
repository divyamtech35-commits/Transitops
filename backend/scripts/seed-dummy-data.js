require('dotenv').config();
const { Client, Databases, ID } = require('node-appwrite');

async function seedDummyData() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = process.env.APPWRITE_DATABASE_ID || 'transitops';

  console.log('Seeding extended dummy data for TransitOps (Up to 20 vehicles)...');

  try {
    // Helpers
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const generateDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
    
    // 1. Generate 20 Vehicles
    const vehicleModels = ['Tata Signa 4225.T', 'Ashok Leyland 3118', 'Volvo FH16', 'Eicher Pro 6028', 'Mahindra Blazo X 49', 'BharatBenz 2823C'];
    const vehicleTypes = ['Truck', 'Trailer', 'Tanker'];
    const createdVehicles = [];

    for (let i = 1; i <= 20; i++) {
      const v = {
        registrationNumber: `MH-${rand(10, 99)}-${randItem(['AB', 'XY', 'MN', 'PQ', 'RS'])}-${rand(1000, 9999)}`,
        model: randItem(vehicleModels),
        type: randItem(vehicleTypes),
        maxLoad: rand(20000, 50000),
        odometer: rand(10000, 200000),
        acquisitionCost: rand(2000000, 6500000),
        status: randItem(['Available', 'Available', 'Available', 'On Trip', 'On Trip', 'In Shop'])
      };
      const doc = await databases.createDocument(dbId, 'vehicles', ID.unique(), v);
      createdVehicles.push(doc);
    }
    console.log(`Created 20 Vehicles.`);

    // 2. Generate 20 Drivers
    const firstNames = ['Rajesh', 'Amit', 'Suresh', 'Manoj', 'Vikram', 'Anil', 'Sunil', 'Vijay', 'Rahul', 'Deepak', 'Sanjay', 'Prakash'];
    const lastNames = ['Kumar', 'Singh', 'Patil', 'Sharma', 'Das', 'Yadav', 'Verma', 'Gupta', 'Chauhan', 'Reddy'];
    const createdDrivers = [];

    for (let i = 1; i <= 20; i++) {
      const d = {
        name: `${randItem(firstNames)} ${randItem(lastNames)}`,
        licenseNumber: `DL-${rand(1990, 2020)}-${rand(1000, 9999)}`,
        licenseCategory: randItem(['HMV', 'LMV', 'TRANS']),
        licenseExpiryDate: generateDate(new Date(2025, 0, 1), new Date(2030, 0, 1)),
        contactNumber: `9${rand(100000000, 999999999)}`,
        safetyScore: rand(60, 100),
        status: randItem(['Available', 'Available', 'Available', 'On Trip', 'On Trip', 'Suspended'])
      };
      const doc = await databases.createDocument(dbId, 'drivers', ID.unique(), d);
      createdDrivers.push(doc);
    }
    console.log(`Created 20 Drivers.`);

    // 3. Generate 60 Trips (Completed & Active)
    const cities = ['Mumbai, MH', 'Delhi, DL', 'Bangalore, KA', 'Chennai, TN', 'Ahmedabad, GJ', 'Pune, MH', 'Kolkata, WB', 'Hyderabad, TS', 'Surat, GJ', 'Jaipur, RJ'];
    const createdTrips = [];

    for (let i = 1; i <= 60; i++) {
      const v = randItem(createdVehicles);
      const d = randItem(createdDrivers);
      const isCompleted = Math.random() > 0.3; // 70% completed
      const plannedDist = rand(300, 2000);
      
      const t = {
        source: randItem(cities),
        destination: randItem(cities),
        vehicleId: v.$id,
        driverId: d.$id,
        cargoWeight: rand(10000, v.maxLoad),
        distance: plannedDist,
        status: isCompleted ? 'Completed' : 'Dispatched',
        plannedStartTime: generateDate(new Date(2025, 0, 1), new Date(2026, 6, 1)),
        initialOdometer: v.odometer - plannedDist - 500
      };

      if (isCompleted) {
        t.completedAt = generateDate(new Date(t.plannedStartTime), new Date(2026, 7, 1));
        t.actualDistance = plannedDist + rand(-50, 150);
        t.finalOdometer = t.initialOdometer + t.actualDistance;
        t.fuelConsumed = t.actualDistance / rand(2, 6); // Efficiency between 2 to 6 km/L
        t.revenue = t.actualDistance * rand(50, 120); // Rs 50-120 per km
      }

      const doc = await databases.createDocument(dbId, 'trips', ID.unique(), t);
      createdTrips.push(doc);
    }
    console.log(`Created 60 Trips.`);

    // 4. Generate Fuel Logs (3 per vehicle)
    for (let i = 1; i <= 60; i++) {
      const v = randItem(createdVehicles);
      const liters = rand(50, 400);
      const f = {
        vehicleId: v.$id,
        date: generateDate(new Date(2025, 0, 1), new Date()),
        liters: liters,
        cost: liters * 90 // ~90 Rs/Liter
      };
      await databases.createDocument(dbId, 'fuellogs', ID.unique(), f);
    }
    console.log(`Created 60 Fuel Logs.`);

    // 5. Generate Maintenance Logs (1-2 per vehicle)
    const maintDescriptions = ['Engine oil change', 'Brake pad replacement', 'Tire rotation', 'Battery replacement', 'Transmission fluid flush', 'General Service'];
    for (let i = 1; i <= 30; i++) {
      const v = randItem(createdVehicles);
      const m = {
        vehicleId: v.$id,
        description: randItem(maintDescriptions),
        cost: rand(2000, 40000),
        status: randItem(['Closed', 'Closed', 'Closed', 'Open'])
      };
      await databases.createDocument(dbId, 'maintenancelogs', ID.unique(), m);
    }
    console.log(`Created 30 Maintenance Logs.`);

    // 6. Generate Expenses (Some linked to trips, some to vehicles directly)
    const expenseTypes = ['Toll', 'Permit', 'Parts', 'Misc'];
    for (let i = 1; i <= 80; i++) {
      const t = randItem(createdTrips);
      const linkToTrip = Math.random() > 0.5;
      
      const e = {
        vehicleId: linkToTrip ? t.vehicleId : randItem(createdVehicles).$id,
        type: randItem(expenseTypes),
        cost: rand(300, 5000),
        date: generateDate(new Date(2025, 0, 1), new Date()),
        description: `Random ${randItem(expenseTypes)} Expense`
      };

      if (linkToTrip) e.tripId = t.$id;

      await databases.createDocument(dbId, 'expenses', ID.unique(), e);
    }
    console.log(`Created 80 General Expenses.`);

    console.log('Successfully seeded extended dummy data! Refresh your UI to see the dashboard.');

  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedDummyData();
