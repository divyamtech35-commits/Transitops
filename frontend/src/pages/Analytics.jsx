import { useState, useEffect } from 'react';
import { getFleetReport } from '../api/reports';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Analytics = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await getFleetReport();
      setReportData(data);
    } catch (err) {
      setError('Failed to fetch analytics data. Ensure you have the right permissions.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    const { vehicles } = reportData;
    
    // Define headers
    const headers = ['Vehicle ID', 'Registration', 'Model', 'Status', 'Distance (km)', 'Fuel (L)', 'Fuel Eff (km/L)', 'Revenue', 'Fuel Cost', 'Maint Cost', 'Op Cost', 'ROI %'];
    
    // Map rows
    const rows = vehicles.map(v => [
      v.vehicleId,
      v.registrationNumber,
      v.model,
      v.status,
      v.distance,
      v.fuelLiters,
      v.fuelEfficiency,
      v.revenue,
      v.fuelCost,
      v.maintenanceCost,
      v.fuelCost + v.maintenanceCost,
      v.roiPercentage
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `fleet_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text('TransitOps Fleet Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const { aggregate, vehicles } = reportData;
    
    // Top Level Summary Table
    doc.autoTable({
      startY: 35,
      head: [['Total Vehicles', 'Active', 'Utilization %', 'Total Revenue', 'Op Cost', 'ROI %']],
      body: [[
        aggregate.totalVehicles,
        aggregate.activeVehicles,
        `${aggregate.fleetUtilization}%`,
        `Rs. ${aggregate.totalRevenue.toLocaleString()}`,
        `Rs. ${aggregate.totalOperationalCost.toLocaleString()}`,
        `${aggregate.overallROIPercentage}%`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] } // amber-500
    });
    
    // Vehicle Breakdown Table
    const tableRows = vehicles.map(v => [
      v.registrationNumber,
      v.model,
      v.status,
      v.distance.toString(),
      `${v.fuelEfficiency} km/L`,
      `Rs. ${v.revenue.toLocaleString()}`,
      `Rs. ${(v.fuelCost + v.maintenanceCost).toLocaleString()}`,
      `${v.roiPercentage}%`
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Registration', 'Model', 'Status', 'Distance (km)', 'Fuel Eff.', 'Revenue', 'Op Cost', 'ROI %']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [31, 41, 55] } // gray-800
    });
    
    doc.save(`fleet_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading analytics...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!reportData) return null;

  const { aggregate, vehicles } = reportData;

  // Chart Data preparation
  const chartData = vehicles.slice(0, 10).map(v => ({
    name: v.registrationNumber,
    Revenue: v.revenue,
    OpCost: v.fuelCost + v.maintenanceCost
  }));

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-400 text-sm">Analyze fleet performance, utilization, and financial ROI.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportCSV}
            className="bg-[#1a1a1a] border border-gray-700 hover:border-gray-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Export CSV
          </button>
          <button 
            onClick={exportPDF}
            className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-amber-900/20"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Fleet Utilization</h3>
          <p className="text-3xl font-bold text-white">{aggregate.fleetUtilization}%</p>
          <p className="text-gray-500 text-sm mt-1">{aggregate.activeVehicles} / {aggregate.totalVehicles} Active</p>
        </div>
        <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Overall ROI</h3>
          <p className={`text-3xl font-bold ${aggregate.overallROIPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {aggregate.overallROIPercentage}%
          </p>
          <p className="text-gray-500 text-sm mt-1">Based on acquisition cost</p>
        </div>
        <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Fuel Efficiency</h3>
          <p className="text-3xl font-bold text-white">{aggregate.overallFuelEfficiency}</p>
          <p className="text-gray-500 text-sm mt-1">Average km / Liter</p>
        </div>
        <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Op Cost</h3>
          <p className="text-3xl font-bold text-amber-500">₹{aggregate.totalOperationalCost.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Fuel + Maintenance</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl mb-8">
        <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-6">Revenue vs Operational Cost (Top 10 Vehicles)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="OpCost" name="Operational Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Vehicle Performance Breakdown</h2>
        <div className="bg-[#121212] rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs uppercase bg-[#1a1a1a] text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Vehicle</th>
                  <th className="px-6 py-4 font-medium">Distance (km)</th>
                  <th className="px-6 py-4 font-medium">Fuel Eff.</th>
                  <th className="px-6 py-4 font-medium">Revenue</th>
                  <th className="px-6 py-4 font-medium">Op Cost</th>
                  <th className="px-6 py-4 font-medium">ROI %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No fleet data available.</td>
                  </tr>
                ) : (
                  vehicles.map((v) => {
                    const opCost = v.fuelCost + v.maintenanceCost;
                    return (
                      <tr key={v.vehicleId} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{v.registrationNumber}</p>
                          <p className="text-xs text-gray-500">{v.model}</p>
                        </td>
                        <td className="px-6 py-4">{v.distance}</td>
                        <td className="px-6 py-4">{v.fuelEfficiency} km/L</td>
                        <td className="px-6 py-4 text-green-400">₹{v.revenue.toLocaleString()}</td>
                        <td className="px-6 py-4 text-amber-500">₹{opCost.toLocaleString()}</td>
                        <td className={`px-6 py-4 font-medium ${v.roiPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {v.roiPercentage}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
