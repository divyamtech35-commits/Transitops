const test = require('node:test');
const assert = require('node:assert');

const API_URL = 'http://localhost:3000/api';
let jwt = '';
let vehicleId = '';
let logId = '';
let driverId = ''; // needed for trip test
let tripId = '';

test('TransitOps Maintenance API Flow', async (t) => {
  
  await t.test('1. Login as Fleet Manager', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fleet@transitops.in', password: 'password123' })
    });
    
    assert.strictEqual(res.status, 200, 'Login should succeed');
    const data = await res.json();
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
        registrationNumber: `TEST-MAINT-${Date.now()}`,
        model: 'Ford Transit',
        type: 'Van',
        maxLoad: 3000,
        odometer: 50000,
        acquisitionCost: 45000,
        status: 'Available'
      })
    });
    
    assert.strictEqual(res.status, 201, 'Vehicle creation should succeed');
    const data = await res.json();
    vehicleId = data.$id;
  });

  await t.test('3. Create Maintenance Log (Sets Vehicle to In Shop)', async () => {
    const res = await fetch(`${API_URL}/maintenance`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        vehicleId,
        description: 'Routine oil change and brake inspection'
      })
    });
    
    assert.strictEqual(res.status, 201, 'Maintenance log creation should succeed');
    const data = await res.json();
    assert.strictEqual(data.log.status, 'Open', 'Log status should be Open');
    assert.strictEqual(data.log.cost, 0, 'Cost should default to 0');
    assert.ok(data.log.openedAt, 'Should have openedAt timestamp');
    logId = data.log.$id;

    // Verify Vehicle Status
    const vehRes = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    const vehData = await vehRes.json();
    assert.strictEqual(vehData.status, 'In Shop', 'Vehicle should be marked In Shop');
  });

  await t.test('4. Prevent Duplicate Open Logs', async () => {
    const res = await fetch(`${API_URL}/maintenance`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        vehicleId,
        description: 'Attempting duplicate'
      })
    });
    
    assert.strictEqual(res.status, 400, 'Should reject duplicate open log');
    const data = await res.json();
    assert.ok(
      data.error.includes('Vehicle is already In Shop.') || data.error.includes('already has an active'), 
      'Should return active log or In Shop error'
    );
  });

  await t.test('5. Prevent Closing with Invalid Cost', async () => {
    const res = await fetch(`${API_URL}/maintenance/${logId}/close`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ cost: -50 }) // Invalid
    });
    
    assert.strictEqual(res.status, 400, 'Should reject negative cost');
  });

  await t.test('6. Close Maintenance Log (Restores Vehicle to Available)', async () => {
    const res = await fetch(`${API_URL}/maintenance/${logId}/close`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ cost: 350.50 })
    });
    
    assert.strictEqual(res.status, 200, 'Closing log should succeed');
    const data = await res.json();
    assert.strictEqual(data.log.status, 'Closed', 'Log status should be Closed');
    assert.strictEqual(data.log.cost, 350.5, 'Cost should be updated');
    assert.ok(data.log.closedAt, 'Should have closedAt timestamp');

    // Verify Vehicle Status
    const vehRes = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    const vehData = await vehRes.json();
    assert.strictEqual(vehData.status, 'Available', 'Vehicle should be restored to Available');
  });

  await t.test('7. Block Maintenance for Dispatched Vehicles', async () => {
    // 7a: Create Driver
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const drvRes = await fetch(`${API_URL}/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
      body: JSON.stringify({
        name: 'Maint Block Driver', licenseNumber: `DL-M-${Date.now()}`,
        licenseCategory: 'Heavy', licenseExpiryDate: futureDate.toISOString(),
        contactNumber: '555', safetyScore: 4.5, status: 'Available'
      })
    });
    driverId = (await drvRes.json()).$id;

    // 7b: Create and Dispatch Trip
    const tripRes = await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
      body: JSON.stringify({
        source: 'A', destination: 'B', vehicleId, driverId,
        cargoWeight: 1000, plannedDistance: 10
      })
    });
    tripId = (await tripRes.json()).$id;

    await fetch(`${API_URL}/trips/${tripId}/dispatch`, {
      method: 'PUT', headers: { 'Authorization': `Bearer ${jwt}` }
    });

    // 7c: Attempt Maintenance
    const maintRes = await fetch(`${API_URL}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
      body: JSON.stringify({ vehicleId, description: 'Block test' })
    });

    assert.strictEqual(maintRes.status, 400, 'Should reject maintenance for On Trip vehicle');
    const maintData = await maintRes.json();
    assert.ok(maintData.error.includes('On Trip'), 'Should explain vehicle is On Trip');
  });
});
