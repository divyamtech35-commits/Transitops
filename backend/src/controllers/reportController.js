const { Client, Databases } = require('node-appwrite');

const getDbClient = () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  return new Databases(client);
};

const DB_ID = process.env.APPWRITE_DATABASE_ID || 'transitops';

const getFleetReport = async (req, res) => {
  try {
    const db = getDbClient();
    
    // Fetch all needed collections (In production, you would use pagination if documents > 100)
    // For this prototype, we'll fetch up to 100 of each which is sufficient
    const [vehiclesRes, tripsRes, fuelRes, maintRes, expRes] = await Promise.all([
      db.listDocuments(DB_ID, 'vehicles'),
      db.listDocuments(DB_ID, 'trips'),
      db.listDocuments(DB_ID, 'fuellogs'),
      db.listDocuments(DB_ID, 'maintenancelogs'),
      db.listDocuments(DB_ID, 'expenses')
    ]);

    const vehicles = vehiclesRes.documents;
    const trips = tripsRes.documents;
    const fuelLogs = fuelRes.documents;
    const maintenanceLogs = maintRes.documents;
    const expenses = expRes.documents;

    let totalDistance = 0;
    let totalFuelLiters = 0;
    let totalRevenue = 0;
    let totalMaintenanceCost = 0;
    let totalFuelCost = 0;
    let totalAcquisitionCost = 0;
    
    let activeVehicles = 0;

    // Grouping by Vehicle
    const vehicleStats = vehicles.map(v => {
      const vTrips = trips.filter(t => t.vehicleId === v.$id && t.status === 'Completed');
      const vFuel = fuelLogs.filter(f => f.vehicleId === v.$id);
      const vMaint = maintenanceLogs.filter(m => m.vehicleId === v.$id && m.status === 'Closed');
      const vExp = expenses.filter(e => e.vehicleId === v.$id); // Optional, for total cost

      const vDistance = vTrips.reduce((sum, t) => sum + (t.actualDistance || 0), 0);
      const vRevenue = vTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      
      const vFuelLiters = vFuel.reduce((sum, f) => sum + (f.liters || 0), 0);
      const vFuelCost = vFuel.reduce((sum, f) => sum + (f.cost || 0), 0);
      const vMaintCost = vMaint.reduce((sum, m) => sum + (m.cost || 0), 0);
      
      const vAcquisition = v.acquisitionCost || 0;

      // Fuel Efficiency = Distance / Fuel
      const fuelEfficiency = vFuelLiters > 0 ? (vDistance / vFuelLiters).toFixed(2) : 0;
      
      // ROI = (Revenue - (Maint + Fuel)) / AcquisitionCost
      const vOpCost = vFuelCost + vMaintCost;
      let roi = 0;
      if (vAcquisition > 0) {
        roi = ((vRevenue - vOpCost) / vAcquisition) * 100; // as percentage
      }

      totalDistance += vDistance;
      totalRevenue += vRevenue;
      totalFuelLiters += vFuelLiters;
      totalFuelCost += vFuelCost;
      totalMaintenanceCost += vMaintCost;
      totalAcquisitionCost += vAcquisition;

      if (v.status === 'On Trip') activeVehicles++;

      return {
        vehicleId: v.$id,
        registrationNumber: v.registrationNumber,
        model: v.model,
        distance: vDistance,
        revenue: vRevenue,
        fuelLiters: vFuelLiters,
        fuelCost: vFuelCost,
        maintenanceCost: vMaintCost,
        acquisitionCost: vAcquisition,
        fuelEfficiency: parseFloat(fuelEfficiency),
        roiPercentage: parseFloat(roi.toFixed(2)),
        status: v.status
      };
    });

    const fleetUtilization = vehicles.length > 0 ? ((activeVehicles / vehicles.length) * 100).toFixed(2) : 0;
    const overallFuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : 0;
    
    let overallROI = 0;
    const overallOpCost = totalFuelCost + totalMaintenanceCost;
    if (totalAcquisitionCost > 0) {
      overallROI = ((totalRevenue - overallOpCost) / totalAcquisitionCost) * 100;
    }

    res.json({
      aggregate: {
        totalVehicles: vehicles.length,
        activeVehicles,
        fleetUtilization: parseFloat(fleetUtilization),
        overallFuelEfficiency: parseFloat(overallFuelEfficiency),
        totalOperationalCost: overallOpCost,
        totalRevenue,
        overallROIPercentage: parseFloat(overallROI.toFixed(2))
      },
      vehicles: vehicleStats
    });

  } catch (error) {
    console.error('Report Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
};

module.exports = {
  getFleetReport
};
