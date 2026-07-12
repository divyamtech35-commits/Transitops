import { useState, useEffect } from 'react';
import { getFleetReport } from '../api/reports';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

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
    
    const headers = ['Vehicle ID', 'Registration', 'Model', 'Status', 'Distance (km)', 'Fuel (L)', 'Fuel Eff (km/L)', 'Revenue', 'Fuel Cost', 'Maint Cost', 'Op Cost', 'ROI %'];
    
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
    
    autoTable(doc, {
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
      headStyles: { fillColor: [245, 158, 11] }
    });
    
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
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Registration', 'Model', 'Status', 'Distance (km)', 'Fuel Eff.', 'Revenue', 'Op Cost', 'ROI %']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [31, 41, 55] }
    });
    
    doc.save(`fleet_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading analytics...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!reportData) return null;

  const { aggregate, vehicles } = reportData;

  const top10Vehicles = vehicles.slice(0, 10);
  
  const financialData = top10Vehicles.map(v => ({
    name: v.registrationNumber,
    Revenue: v.revenue,
    OpCost: v.fuelCost + v.maintenanceCost
  }));

  const efficiencyData = top10Vehicles.map(v => ({
    name: v.registrationNumber,
    Efficiency: v.fuelEfficiency
  }));

  const utilizationData = [
    { name: 'Active (On Trip)', value: aggregate.activeVehicles },
    { name: 'Available / Idle', value: vehicles.filter(v => v.status === 'Available').length },
    { name: 'In Shop', value: vehicles.filter(v => v.status === 'In Shop').length },
    { name: 'Retired', value: vehicles.filter(v => v.status === 'Retired').length }
  ].filter(d => d.value > 0);

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
        <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl hover:border-amber-500/50 transition-colors">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Fleet Utilization</h3>
          <p className="text-3xl font-bold text-white">{aggregate.fleetUtilization}%</p>
          <p className="text-gray-500 text-sm mt-1">{aggregate.activeVehicles} / {aggregate.totalVehicles} Active</p>
        </div>
        <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl hover:border-amber-500/50 transition-colors">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Overall ROI</h3>
          <p className={`text-3xl font-bold ${aggregate.overallROIPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {aggregate.overallROIPercentage}%
          </p>
          <p className="text-gray-500 text-sm mt-1">Based on acquisition cost</p>
        </div>
        <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl hover:border-amber-500/50 transition-colors">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Fuel Efficiency</h3>
          <p className="text-3xl font-bold text-white">{aggregate.overallFuelEfficiency}</p>
          <p className="text-gray-500 text-sm mt-1">Average km / Liter</p>
        </div>
        <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl hover:border-amber-500/50 transition-colors">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Op Cost</h3>
          <p className="text-3xl font-bold text-amber-500">₹{aggregate.totalOperationalCost.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Fuel + Maintenance</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Revenue vs Op Cost */}
        <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-6">Revenue vs Op Cost (Top 10)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip cursor={{fill: '#1a1a1a'}} contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="OpCost" name="Operational Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Status Distribution */}
        <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-6">Fleet Status Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fuel Efficiency by Vehicle */}
        <div className="bg-[#121212] border border-gray-800 p-6 rounded-xl lg:col-span-2">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-6">Fuel Efficiency by Vehicle (km/L)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficiencyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="Efficiency" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEff)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
