import React, { useState, useMemo } from 'react';
// 1. Import icons and charts
import { 
  Ship, BarChart3, Scale, Users, CheckCircle, XCircle, 
  AlertTriangle, TrendingDown, LayoutDashboard, Search, Menu, Bell, Plus, Trash2, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 2. Import Domain Types & Hook
import { useFuelEU } from './adapters/ui/hooks/useFuelEU';
import { RouteEntity, TARGET_GHG } from './core/domain/Route';
import { ComplianceBalance } from './core/domain/Compliance';
import { PoolMember } from './core/domain/Pool';

// --- UI UTILITY ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- SHARED COMPONENTS ---
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const Badge = ({ compliant }: { compliant: boolean }) => (
  <span className={cn(
    "px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center w-fit gap-1.5 border",
    compliant 
      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
      : "bg-rose-50 text-rose-700 border-rose-200"
  )}>
    {compliant ? <CheckCircle size={12} /> : <XCircle size={12} />}
    {compliant ? "Compliant" : "Deficit"}
  </span>
);

const MetricCard = ({ title, value, sub, color }: { title: string, value: string, sub: string, color: 'blue' | 'emerald' | 'slate' }) => {
    const styles = {
        blue: "bg-gradient-to-br from-blue-600 to-blue-800 text-white",
        emerald: "bg-emerald-600 text-white",
        slate: "bg-white border border-slate-200 text-slate-800"
    };

    return (
        <div className={cn("rounded-xl p-6 shadow-sm", styles[color])}>
            <h3 className={cn("font-medium mb-1 text-sm opacity-90", color === 'slate' ? 'text-slate-500' : 'text-blue-100')}>{title}</h3>
            <div className="text-3xl font-bold mb-2 tracking-tight">{value}</div>
            <span className={cn("text-xs px-2 py-1 rounded inline-flex items-center gap-1", 
                color === 'slate' ? "bg-slate-100 text-slate-600" : "bg-white/20 text-white")}>
                {sub}
            </span>
        </div>
    );
};

// --- MODALS ---

const AddShipModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (m: PoolMember) => void }) => {
    const [form, setForm] = useState({ id: '', name: '', cb: '' });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            shipId: form.id || `IMO-${Math.floor(Math.random()*100000)}`,
            vesselName: form.name,
            verifiedCb: Number(form.cb)
        });
        setForm({ id: '', name: '', cb: '' }); // Reset
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Add Ship to Pool</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vessel Name</label>
                        <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Nordic Spirit" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">IMO Number / ID</label>
                        <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={form.id} onChange={e => setForm({...form, id: e.target.value})} placeholder="e.g. 9876543" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Compliance Balance (CB)</label>
                        <input required type="number" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={form.cb} onChange={e => setForm({...form, cb: e.target.value})} placeholder="e.g. 1200 or -500" />
                        <p className="text-xs text-slate-500 mt-1">Positive for surplus, negative for deficit.</p>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Add Ship</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- FEATURE TABS (UI ADAPTERS) ---

// 1. ROUTES TAB
interface RoutesTabProps {
  routes: RouteEntity[];
  onSetBaseline: (id: string) => void;
}
const RoutesTab = ({ routes, onSetBaseline }: RoutesTabProps) => {
  // State for 4 Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVessel, setFilterVessel] = useState('All');
  const [filterFuel, setFilterFuel] = useState('All');
  const [filterYear, setFilterYear] = useState('All');

  // Multi-criteria Filtering Logic
  const filtered = useMemo(() => {
    return routes.filter(r => {
        const matchVessel = filterVessel === 'All' || r.vesselType === filterVessel;
        const matchFuel = filterFuel === 'All' || r.fuelType === filterFuel;
        const matchYear = filterYear === 'All' || r.year.toString() === filterYear;
        const matchSearch = r.routeId.toLowerCase().includes(searchQuery.toLowerCase());

        return matchVessel && matchFuel && matchYear && matchSearch;
    });
  }, [routes, filterVessel, filterFuel, filterYear, searchQuery]);

  // Extract unique values for dropdowns
  const uniqueFuels = Array.from(new Set(routes.map(r => r.fuelType)));
  const uniqueYears = Array.from(new Set(routes.map(r => r.year)));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
            <h2 className="text-xl font-bold text-slate-800">Fleet Routes</h2>
            <p className="text-sm text-slate-500">Manage route data and set emission baselines.</p>
        </div>
        
        {/* FILTER BAR */}
        <div className="flex flex-wrap gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search ID..." 
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            {/* Filter: Vessel */}
            <select 
                className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white transition"
                value={filterVessel} onChange={(e) => setFilterVessel(e.target.value)}
            >
                <option value="All">All Vessels</option>
                <option value="Container">Container</option>
                <option value="Tanker">Tanker</option>
                <option value="Bulker">Bulker</option>
                <option value="BulkCarrier">Bulk Carrier</option>
                <option value="RoRo">RoRo</option>
            </select>

            {/* Filter: Fuel */}
            <select 
                className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white transition"
                value={filterFuel} onChange={(e) => setFilterFuel(e.target.value)}
            >
                <option value="All">All Fuels</option>
                {uniqueFuels.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            {/* Filter: Year */}
            <select 
                className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white transition"
                value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
            >
                <option value="All">All Years</option>
                {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">Route ID</th>
                <th className="px-6 py-4">Vessel / Fuel</th>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4">GHG Intensity</th>
                <th className="px-6 py-4">Fuel Cons.</th>
                <th className="px-6 py-4">Total Emissions</th>
                <th className="px-6 py-4">Distance</th>
                <th className="px-6 py-4 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.routeId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{r.routeId}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{r.vesselType}</span>
                        <span className="text-xs text-slate-400">{r.fuelType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{r.year}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <span className={cn("font-mono", r.ghgIntensity > TARGET_GHG ? "text-rose-600" : "text-emerald-600")}>
                            {r.ghgIntensity.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400">gCO₂e/MJ</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono">{r.fuelConsumption.toLocaleString()} <span className="text-xs text-slate-400 sans-serif">t</span></td>
                  <td className="px-6 py-4 font-mono">{r.totalEmissions.toLocaleString()} <span className="text-xs text-slate-400 sans-serif">t</span></td>
                  <td className="px-6 py-4 font-mono">{r.distance.toLocaleString()} <span className="text-xs text-slate-400 sans-serif">km</span></td>
                  <td className="px-6 py-4 text-right">
                    {r.isBaseline ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                            Current Baseline
                        </span>
                    ) : (
                        <button 
                            onClick={() => onSetBaseline(r.routeId)}
                            className="text-slate-500 hover:text-blue-600 font-medium text-xs hover:bg-blue-50 px-3 py-1.5 rounded transition"
                        >
                            Set as Baseline
                        </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                        No routes found matching your filters.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// 2. COMPARE TAB
const CompareTab = ({ routes }: { routes: RouteEntity[] }) => {
  const data = useMemo(() => routes.map(r => ({
    ...r,
    compliant: r.ghgIntensity <= TARGET_GHG,
    diff: ((r.ghgIntensity / TARGET_GHG) - 1) * 100
  })), [routes]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <Card className="p-6 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Intensity vs Target</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Compliant
                    <div className="w-3 h-3 bg-rose-500 rounded-sm ml-2"></div> Deficit
                </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 110]} tick={{fontSize: 12}} />
                  <YAxis dataKey="routeId" type="category" width={60} tick={{fontSize: 12, fontWeight: 600}} />
                  <RechartsTooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="ghgIntensity" barSize={24} radius={[0, 4, 4, 0]}>
                     {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.ghgIntensity > TARGET_GHG ? '#f43f5e' : '#10b981'} />
                     ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
            <MetricCard 
                title="2025 Target Intensity" 
                value={`${TARGET_GHG.toFixed(2)}`} 
                sub="gCO₂e/MJ" 
                color="slate" 
            />
            <div className="bg-slate-900 rounded-xl p-6 text-slate-300 shadow-lg">
                <h4 className="text-xs uppercase font-bold tracking-wider mb-4 text-slate-500">Compliance Status</h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span>Compliant Routes</span>
                        <span className="text-emerald-400 font-bold">{data.filter(d => d.compliant).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Non-Compliant</span>
                        <span className="text-rose-400 font-bold">{data.filter(d => !d.compliant).length}</span>
                    </div>
                    <div className="h-px bg-slate-800 my-2"></div>
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <TrendingDown size={16} />
                        <span>Avg. 2.4% Reduction needed</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <Card>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
            <tr>
              <th className="px-6 py-4">Route</th>
              <th className="px-6 py-4">Actual Intensity</th>
              <th className="px-6 py-4">% Deviation</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(r => (
              <tr key={r.routeId}>
                <td className="px-6 py-4 font-medium text-slate-900">{r.routeId}</td>
                <td className="px-6 py-4 font-mono">{r.ghgIntensity.toFixed(2)}</td>
                <td className={cn("px-6 py-4 font-bold font-mono", r.diff > 0 ? "text-rose-600" : "text-emerald-600")}>
                  {r.diff > 0 ? "+" : ""}{r.diff.toFixed(2)}%
                </td>
                <td className="px-6 py-4"><Badge compliant={r.compliant} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// 3. BANKING TAB
interface BankingTabProps {
    balance: ComplianceBalance | null;
    onBank: (amount: number) => void;
    onApply: (amount: number) => void;
}

const BankingTab = ({ balance, onBank, onApply }: BankingTabProps) => {
  const [bankAmount, setBankAmount] = useState<number>(0);
  const [applyAmount, setApplyAmount] = useState<number>(0);

  if (!balance) return <div className="p-8 text-center text-slate-500">Loading compliance data...</div>;
  
  // Logic for UI states
  const hasDeficit = balance.balance < 0;
  const hasSurplus = balance.balance > 0;
  const canBank = hasSurplus;
  const canApply = hasDeficit && balance.banked > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard 
            title="Current Compliance Balance" 
            value={balance.balance.toLocaleString()} 
            sub={hasDeficit ? "Deficit" : "Surplus"} 
            color={hasDeficit ? "slate" : "blue"} // Change color based on status
        />
        <MetricCard 
            title="Banked from Previous Years" 
            value={balance.banked.toLocaleString()} 
            sub="Available" 
            color={hasDeficit ? "emerald" : "slate"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SECTION A: BANKING (Forward) */}
          <Card className={cn("p-8 border-t-4 transition-all", canBank ? "border-t-blue-600 opacity-100" : "border-t-slate-300 opacity-60 grayscale")}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Scale size={24} /></div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Bank Surplus</h3>
                    <p className="text-sm text-slate-500">Transfer surplus to next year.</p>
                </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount to Bank</label>
                <div className="flex flex-col gap-4">
                    <input 
                        type="number" 
                        disabled={!canBank}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white disabled:bg-slate-100"
                        value={bankAmount}
                        onChange={e => setBankAmount(Number(e.target.value))}
                        placeholder={canBank ? "Enter amount..." : "Requires positive balance"}
                    />
                    <button 
                        onClick={() => { onBank(bankAmount); setBankAmount(0); }}
                        disabled={!canBank || bankAmount <= 0}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                    >
                        Bank Surplus
                    </button>
                </div>
            </div>
          </Card>

          {/* SECTION B: APPLYING (Backward/Present) */}
          <Card className={cn("p-8 border-t-4 transition-all", canApply ? "border-t-emerald-500 opacity-100" : "border-t-slate-300 opacity-60 grayscale")}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingDown size={24} /></div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Apply Banked</h3>
                    <p className="text-sm text-slate-500">Use past credits to offset deficit.</p>
                </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount to Apply</label>
                <div className="flex flex-col gap-4">
                    <input 
                        type="number" 
                        disabled={!canApply}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white disabled:bg-slate-100"
                        value={applyAmount}
                        onChange={e => setApplyAmount(Number(e.target.value))}
                        placeholder={canApply ? "Enter amount..." : "Requires deficit & banked"}
                    />
                    <button 
                        onClick={() => { onApply(applyAmount); setApplyAmount(0); }}
                        disabled={!canApply || applyAmount <= 0}
                        className="w-full px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                    >
                        Offset Deficit
                    </button>
                </div>
            </div>
          </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-sm text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <span className="font-bold block mb-1">Article 20 Compliance Rules:</span>
            <ul className="list-disc pl-4 space-y-1 opacity-90">
                <li>You can only <strong>Bank</strong> if you have a Compliance Surplus (Balance &gt; 0).</li>
                <li>You can only <strong>Apply</strong> if you have a Deficit (Balance &lt; 0) and available Banked credits.</li>
            </ul>
          </div>
      </div>
    </div>
  );
};

// 4. POOLING TAB
interface PoolingTabProps {
    members: PoolMember[];
    onAdd: (m: PoolMember) => void;
    onRemove: (id: string) => void;
    onCreate: () => void;
    activePool: any;
}

const PoolingTab = ({ members, onAdd, onRemove, onCreate, activePool }: PoolingTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const poolSum = members.reduce((acc, curr) => acc + curr.verifiedCb, 0);
  const isValid = poolSum >= 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
      <AddShipModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={onAdd} />

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800">Compliance Pooling</h2>
          <p className="text-sm text-slate-500">FuelEU Maritime Article 21</p>
        </div>
        <div className={cn("px-6 py-3 rounded-xl border flex flex-col items-end shadow-sm", isValid ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200")}>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Projected Pool Balance</span>
          <span className={cn("text-3xl font-bold", isValid ? "text-emerald-700" : "text-rose-700")}>
            {poolSum > 0 ? "+" : ""}{poolSum}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                <Ship size={20} />
              </div>
              <div>
                  <div className="font-bold text-slate-800">{m.vesselName}</div>
                  <div className="text-xs text-slate-500">{m.shipId}</div>
              </div>
            </div>
            <div className="text-right">
                <span className={cn("font-mono font-bold text-lg block", m.verifiedCb >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {m.verifiedCb > 0 ? "+" : ""}{m.verifiedCb}
                </span>
                {i > 0 && (
                     <button onClick={() => onRemove(m.shipId)} className="text-xs text-rose-500 hover:underline mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Remove
                     </button>
                )}
            </div>
          </div>
        ))}
        
        <button onClick={() => setIsModalOpen(true)} className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition gap-2 group min-h-[100px]">
          <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
            <Plus size={20} />
          </div>
          <span className="font-medium">Add Ship to Pool</span>
        </button>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-200">
        <button 
          onClick={onCreate}
          disabled={!isValid || activePool}
          className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg"
        >
          {activePool ? <CheckCircle size={18} /> : <Users size={18} />}
          {activePool ? "Pool Active" : "Finalize Pool Configuration"}
        </button>
      </div>
    </div>
  );
};

// --- APP SHELL ---
export default function App() {
  const [activeTab, setActiveTab] = useState('routes');
  const { routes, balance, pooling, actions, loading } = useFuelEU();

  const tabs = [
    { id: 'routes', label: 'Routes', icon: LayoutDashboard },
    { id: 'compare', label: 'Compare', icon: BarChart3 },
    { id: 'banking', label: 'Banking', icon: Scale },
    { id: 'pooling', label: 'Pooling', icon: Users },
  ];

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex-shrink-0 hidden lg:flex flex-col border-r border-slate-800">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 text-white font-bold text-2xl tracking-tight">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
                <Ship className="text-white" size={24} />
            </div>
            <span>Feul<span className="text-blue-500">EU</span></span>
          </div>
          <p className="text-xs text-slate-500 mt-2 ml-1">Emission Compliance Suite</p>
        </div>

        <div className="px-6 py-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Main Menu</div>
            <nav className="space-y-1">
            {tabs.map(tab => (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                    activeTab === tab.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50 translate-x-1" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
                >
                <tab.icon size={20} className={activeTab === tab.id ? "text-blue-200" : "text-slate-400"} />
                {tab.label}
                </button>
            ))}
            </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800">
             <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle size={14} />
                    </div>
                    <div>
                        <div className="text-white text-sm font-bold">System Online</div>
                        <div className="text-xs text-slate-400">v2.4.0 • Stable</div>
                    </div>
                </div>
             </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-20 flex items-center px-8 justify-between shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
             <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                <Menu size={24} />
             </button>
             <h1 className="text-xl font-bold text-slate-800 capitalize flex items-center gap-2">
                {activeTab} Overview
             </h1>
          </div>
          <div className="flex items-center gap-6">
             <div className="h-8 w-px bg-slate-200"></div>
             <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-800">Capt. XYZ</div>
                    <div className="text-xs text-slate-500">Fleet Manager</div>
                 </div>
                 <div className="w-10 h-10 bg-gradient-to-tr from-blue-100 to-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shadow-inner">
                    FM
                 </div>
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'routes' && <RoutesTab routes={routes} onSetBaseline={actions.setBaseline} />}
            {activeTab === 'compare' && <CompareTab routes={routes} />}
            {activeTab === 'banking' && <BankingTab balance={balance} onBank={actions.bankSurplus} onApply={actions.applySurplus}/>}
            {activeTab === 'pooling' && <PoolingTab members={pooling.draft} activePool={pooling.activePool} onAdd={actions.addPoolMember} onRemove={actions.removePoolMember} onCreate={actions.createPool} />}
          </div>
        </div>
      </main>
    </div>
  );
}