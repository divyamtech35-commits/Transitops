const test = require('node:test');
const assert = require('node:assert');

const API_URL = 'http://localhost:3000/api';
let fleetJwt = '';
let driverJwt = '';
let vehicleId = '';

test('TransitOps Fuel & Expenses API Flow', async (t) => {
  
  await t.test('1. Login as Fleet Manager & Driver', async () => {
    // Fleet Manager Login
    const fRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fleet@transitops.in', password: 'password123' })
    });
    assert.strictEqual(fRes.status, 200);
    fleetJwt = (await fRes.json()).jwt;

    // Driver Login
    const dRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@transitops.in', password: 'password123' })
    });
    assert.strictEqual(dRes.status, 200);
    driverJwt = (await dRes.json()).jwt;
  });

  await t.test('2. Create Valid Vehicle', async () => {
    const res = await fetch(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fleetJwt}`
      },
      body: JSON.stringify({
        registrationNumber: `TEST-FUEL-${Date.now()}`,
        model: 'Volvo Fueler',
        type: 'Truck',
        maxLoad: 5000,
        odometer: 10000,
        acquisitionCost: 50000,
        status: 'Available'
      })
    });
    assert.strictEqual(res.status, 201);
    vehicleId = (await res.json()).$id;
  });

  await t.test('3. Fleet Manager creates Fuel Log', async () => {
    const res = await fetch(`${API_URL}/fuel-logs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fleetJwt}`
      },
      body: JSON.stringify({
        vehicleId,
        liters: 50,
        cost: 4500
      })
    });
    assert.strictEqual(res.status, 201, 'Fleet Manager should be able to create Fuel Logs');
  });

  await t.test('4. Driver creates Fuel Log', async () => {
    const res = await fetch(`${API_URL}/fuel-logs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverJwt}`
      },
      body: JSON.stringify({
        vehicleId,
        liters: 100,
        cost: 9000
      })
    });
    assert.strictEqual(res.status, 201, 'Driver should be able to create Fuel Logs');
  });

  await t.test('5. Driver attempts to create Expense (Blocked by RBAC)', async () => {
    const res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverJwt}`
      },
      body: JSON.stringify({
        vehicleId,
        type: 'Toll',
        cost: 150
      })
    });
    assert.strictEqual(res.status, 403, 'Driver should be forbidden from creating Expenses');
  });

  await t.test('6. Fleet Manager creates valid Expense', async () => {
    const res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fleetJwt}`
      },
      body: JSON.stringify({
        vehicleId,
        type: 'Toll',
        cost: 300,
        description: 'Highway toll'
      })
    });
    assert.strictEqual(res.status, 201, 'Fleet Manager should be able to create Expenses');
  });

  await t.test('7. Reject Expense with type Fuel', async () => {
    const res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fleetJwt}`
      },
      body: JSON.stringify({
        vehicleId,
        type: 'Fuel',
        cost: 500
      })
    });
    assert.strictEqual(res.status, 400, 'Expense API should reject type: Fuel');
  });

  await t.test('8. Reject missing/invalid vehicle ID', async () => {
    const res = await fetch(`${API_URL}/fuel-logs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fleetJwt}`
      },
      body: JSON.stringify({
        vehicleId: 'invalid-id-that-doesnt-exist',
        liters: 10,
        cost: 1000
      })
    });
    assert.strictEqual(res.status, 400, 'Should reject invalid vehicleId');
    const data = await res.json();
    assert.ok(data.error.includes('Invalid Vehicle ID'), 'Should specify vehicle error');
  });

});
