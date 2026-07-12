const test = require('node:test');
const assert = require('node:assert');

const API_URL = 'http://localhost:3000/api';
let jwt = '';
let vehicleId = '';
let driverId = '';
let tripId = '';

test('TransitOps Backend REST API Flow', async (t) => {
  
  await t.test('1. Login as Fleet Manager', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fleet@transitops.in', password: 'password123' })
    });
    
    assert.strictEqual(res.status, 200, 'Login should succeed');
    const data = await res.json();
    assert.ok(data.jwt, 'Should return a JWT');
    assert.strictEqual(data.role, 'FleetManager', 'Should have FleetManager role');
    
    jwt = data.jwt;
  });

  await t.test('2. Create Vehicle (Available)', async () => {
    const res = await fetch(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        registrationNumber: `TEST-TRUCK-${Date.now()}`,
        model: 'Volvo FH16',
        type: 'Truck',
        maxLoad: 10000, // 10 tons
        odometer: 15000,
        acquisitionCost: 120000,
        status: 'Available'
      })
    });
    
    assert.strictEqual(res.status, 201, 'Vehicle creation should succeed');
    const data = await res.json();
    assert.ok(data.$id, 'Should return a vehicle ID');
    vehicleId = data.$id;
  });

  await t.test('3. Create Driver (Available)', async () => {
    // Generate a future date for expiry
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const res = await fetch(`${API_URL}/drivers`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        name: 'John Test Driver',
        licenseNumber: `DL-${Date.now()}`,
        licenseCategory: 'Heavy',
        licenseExpiryDate: futureDate.toISOString(),
        contactNumber: '555-0199',
        safetyScore: 4.5,
        status: 'Available'
      })
    });
    
    assert.strictEqual(res.status, 201, 'Driver creation should succeed');
    const data = await res.json();
    assert.ok(data.$id, 'Should return a driver ID');
    driverId = data.$id;
  });

  await t.test('4. Create Trip (Fails due to maxLoad)', async () => {
    const res = await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        source: 'Warehouse A',
        destination: 'Warehouse B',
        vehicleId,
        driverId,
        cargoWeight: 15000, // Exceeds 10000 maxLoad
        plannedDistance: 100
      })
    });
    
    assert.strictEqual(res.status, 400, 'Should reject due to maxLoad violation');
  });

  await t.test('5. Create Trip (Success - Draft)', async () => {
    const res = await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        source: 'Warehouse A',
        destination: 'Warehouse B',
        vehicleId,
        driverId,
        cargoWeight: 8000, // Valid
        plannedDistance: 100
      })
    });
    
    assert.strictEqual(res.status, 201, 'Trip creation should succeed');
    const data = await res.json();
    assert.strictEqual(data.status, 'Draft', 'Trip should start as Draft');
    tripId = data.$id;
  });

  await t.test('6. Dispatch Trip (Sets statuses to On Trip)', async () => {
    const res = await fetch(`${API_URL}/trips/${tripId}/dispatch`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    
    assert.strictEqual(res.status, 200, 'Dispatch should succeed');
    const data = await res.json();
    assert.strictEqual(data.trip.status, 'Dispatched', 'Trip status should be Dispatched');
    assert.ok(data.trip.dispatchedAt, 'Should record dispatchedAt timestamp');
    
    // Verify Vehicle and Driver Statuses
    const vehRes = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    const vehData = await vehRes.json();
    assert.strictEqual(vehData.status, 'On Trip', 'Vehicle should be marked On Trip');

    const drvRes = await fetch(`${API_URL}/drivers/${driverId}`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    const drvData = await drvRes.json();
    assert.strictEqual(drvData.status, 'On Trip', 'Driver should be marked On Trip');
  });

  await t.test('7. Complete Trip (Restores statuses and updates odometer)', async () => {
    const res = await fetch(`${API_URL}/trips/${tripId}/complete`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        finalOdometer: 15120, // 120km driven
        fuelConsumed: 25.5
      })
    });
    
    assert.strictEqual(res.status, 200, 'Completion should succeed');
    const data = await res.json();
    assert.strictEqual(data.trip.status, 'Completed', 'Trip status should be Completed');
    assert.strictEqual(data.trip.actualDistance, 120, 'Should correctly calculate actual distance (15120 - 15000)');
    
    // Verify Vehicle and Driver Statuses are restored
    const vehRes = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    const vehData = await vehRes.json();
    assert.strictEqual(vehData.status, 'Available', 'Vehicle should be restored to Available');
    assert.strictEqual(vehData.odometer, 15120, 'Vehicle odometer should be permanently updated');

    const drvRes = await fetch(`${API_URL}/drivers/${driverId}`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    const drvData = await drvRes.json();
    assert.strictEqual(drvData.status, 'Available', 'Driver should be restored to Available');
  });

});
