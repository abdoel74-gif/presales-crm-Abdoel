import React, { useState } from 'react';
import {
  X,
  Calculator,
  Server,
  HardDrive,
  Shield,
  Network,
  Database,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SizingCategory, SizingParameters, SizingRedundancy } from '../types.ts';

interface SizingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCalculations: (category: SizingCategory, params: SizingParameters, justification: string) => void;
  initialCategory?: SizingCategory;
}

export const SizingCalculatorModal: React.FC<SizingCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyCalculations,
  initialCategory = 'Compute / Server',
}) => {
  const [activeTab, setActiveTab] = useState<SizingCategory>(initialCategory);

  // Compute Calculator State
  const [totalvCPUs, setTotalvCPUs] = useState<number>(180);
  const [oversubscription, setOversubscription] = useState<number>(2.5);
  const [targetRamGb, setTargetRamGb] = useState<number>(1024);
  const [ramHeadroomPct, setRamHeadroomPct] = useState<number>(20);
  const [coresPerNode, setCoresPerNode] = useState<number>(64); // 2x 32C
  const [ramPerNodeGb, setRamPerNodeGb] = useState<number>(512);
  const [computeRedundancy, setComputeRedundancy] = useState<SizingRedundancy>('N+1 Redundancy');

  // Storage Calculator State
  const [usableCapacityTb, setUsableCapacityTb] = useState<number>(50);
  const [annualGrowthPct, setAnnualGrowthPct] = useState<number>(20);
  const [projectionYears, setProjectionYears] = useState<number>(3);
  const [raidType, setRaidType] = useState<'RAID 10' | 'RAID 5' | 'RAID 6' | 'Erasure Coding 4+2'>('Erasure Coding 4+2');
  const [dedupRatio, setDedupRatio] = useState<number>(3.0);
  const [iopsTarget, setIopsTarget] = useState<number>(200000);

  // Network & Firewall State
  const [throughputGbps, setThroughputGbps] = useState<number>(20);
  const [concurrentSessions, setConcurrentSessions] = useState<number>(2000000);
  const [sslInspection, setSslInspection] = useState<boolean>(true);
  const [serverCount25G, setServerCount25G] = useState<number>(8);

  // Backup State
  const [protectedDataTb, setProtectedDataTb] = useState<number>(40);
  const [dailyChangePct, setDailyChangePct] = useState<number>(5);
  const [retentionDaysLocal, setRetentionDaysLocal] = useState<number>(30);
  const [backupDedupRatio, setBackupDedupRatio] = useState<number>(15);

  if (!isOpen) return null;

  // Compute Math
  const effectivePhysicalCoresNeeded = Math.ceil(totalvCPUs / oversubscription);
  const effectiveRamNeededGb = Math.ceil(targetRamGb * (1 + ramHeadroomPct / 100));
  
  const rawNodesForCpu = Math.ceil(effectivePhysicalCoresNeeded / coresPerNode);
  const rawNodesForRam = Math.ceil(effectiveRamNeededGb / ramPerNodeGb);
  const baseNodes = Math.max(rawNodesForCpu, rawNodesForRam, 2);
  
  const totalNodes = computeRedundancy === 'N+1 Redundancy' ? baseNodes + 1 : computeRedundancy === '2N High Availability' ? baseNodes * 2 : baseNodes;
  const totalClusterCores = totalNodes * coresPerNode;
  const totalClusterRam = totalNodes * ramPerNodeGb;
  const totalClusterWatts = totalNodes * 750;
  const totalClusterRu = totalNodes * 2;

  // Storage Math
  const futureUsableTb = usableCapacityTb * Math.pow(1 + annualGrowthPct / 100, projectionYears);
  const raidOverhead = raidType === 'RAID 10' ? 2.0 : raidType === 'RAID 6' ? 1.33 : raidType === 'Erasure Coding 4+2' ? 1.5 : 1.25;
  const effectiveCapacityAfterDedupTb = futureUsableTb / dedupRatio;
  const rawStorageRequiredTb = Math.ceil(effectiveCapacityAfterDedupTb * raidOverhead);

  // Backup Math
  const dailyIncrementalTb = protectedDataTb * (dailyChangePct / 100);
  const fullBackupCopies = Math.ceil(retentionDaysLocal / 7);
  const totalRawBackupTb = (protectedDataTb * fullBackupCopies) + (dailyIncrementalTb * retentionDaysLocal);
  const usableBackupRepoTb = Math.ceil(totalRawBackupTb / backupDedupRatio);

  const handleApplyCompute = () => {
    const params: SizingParameters = {
      totalvCPUs,
      oversubscriptionRatio: `1:${oversubscription}`,
      targetRamGb: effectiveRamNeededGb,
      ramHeadroomPct,
      nodeCount: totalNodes,
      cpuArchitecture: `Dual Socket (${coresPerNode} Cores per Node)`,
      rackUnitsRu: totalClusterRu,
      powerConsumptionWatts: totalClusterWatts,
    };
    const text = `Sized for ${totalvCPUs} vCPUs (@ 1:${oversubscription} oversubscription) and ${targetRamGb}GB RAM with ${ramHeadroomPct}% growth buffer. Requires ${totalNodes}x Enterprise Nodes configured with ${computeRedundancy} failover protection (${totalClusterCores} Total Cores, ${totalClusterRam}GB Cluster RAM, ${totalClusterRu}RU footprint).`;
    onApplyCalculations('Compute / Server', params, text);
    onClose();
  };

  const handleApplyStorage = () => {
    const params: SizingParameters = {
      usableCapacityTb: Math.round(futureUsableTb),
      rawCapacityTb: rawStorageRequiredTb,
      raidType,
      dedupCompressionRatio: `${dedupRatio}:1`,
      workloadIopsTarget: iopsTarget,
      storageTier: 'All-NVMe SSD',
      annualGrowthPct,
      rackUnitsRu: 2,
      powerConsumptionWatts: 650,
    };
    const text = `Sized for ${usableCapacityTb}TB usable base capacity projected to ${Math.round(futureUsableTb)}TB across ${projectionYears} years (${annualGrowthPct}% annual growth). With ${raidType} and ${dedupRatio}:1 inline data reduction, the required raw NVMe tier is ${rawStorageRequiredTb}TB, delivering up to ${iopsTarget.toLocaleString()} IOPS at <0.5ms response.`;
    onApplyCalculations('Enterprise Storage (SAN/NAS)', params, text);
    onClose();
  };

  const handleApplyNetwork = () => {
    const params: SizingParameters = {
      throughputGbps,
      concurrentSessions,
      sslInspectionRequired: sslInspection,
      portRequirements25G: serverCount25G * 2,
      portRequirements100G: 4,
      rackUnitsRu: 2,
      powerConsumptionWatts: 700,
    };
    const text = `Sized for ${throughputGbps} Gbps throughput, ${concurrentSessions.toLocaleString()} concurrent connections with SSL deep inspection. Leaf switch topology requires ${serverCount25G * 2}x 25G SFP28 server links with 4x 100G uplinks in dual active-active configuration.`;
    onApplyCalculations('Next-Gen Firewall & Security', params, text);
    onClose();
  };

  const handleApplyBackup = () => {
    const params: SizingParameters = {
      totalProtectedDataTb: protectedDataTb,
      dailyChangeRatePct: dailyChangePct,
      retentionDaysLocal,
      retentionDaysCloud: 365,
      targetRpoMinutes: 15,
      targetRtoMinutes: 60,
      rackUnitsRu: 2,
      powerConsumptionWatts: 450,
    };
    const text = `Sized for ${protectedDataTb}TB source workloads with ${dailyChangePct}% daily delta over ${retentionDaysLocal} days on-prem retention. With ${backupDedupRatio}:1 deduplication, requires a ${usableBackupRepoTb}TB immutable backup appliance repository.`;
    onApplyCalculations('Backup & Disaster Recovery', params, text);
    onClose();
  };

  return (
    <div
      id="sizing-calculator-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Technical Sizing & Topology Calculator
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-medium">
                  Dynamic Formulas
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mathematical workload modeling for enterprise compute, all-flash storage, throughput, and backup retention
              </p>
            </div>
          </div>
          <button
            id="close-sizing-calc-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('Compute / Server')}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'Compute / Server'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> Compute & Virtualization
          </button>
          <button
            onClick={() => setActiveTab('Enterprise Storage (SAN/NAS)')}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'Enterprise Storage (SAN/NAS)'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" /> Enterprise Storage & IOPS
          </button>
          <button
            onClick={() => setActiveTab('Next-Gen Firewall & Security')}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'Next-Gen Firewall & Security'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Network & Firewall
          </button>
          <button
            onClick={() => setActiveTab('Backup & Disaster Recovery')}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'Backup & Disaster Recovery'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Backup & DR Retention
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: COMPUTE SIZING */}
          {activeTab === 'Compute / Server' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Workload Requirements</h3>
                  
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Total Workload vCPUs</span>
                      <span className="font-mono text-indigo-400 font-bold">{totalvCPUs} vCPUs</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={600}
                      step={8}
                      value={totalvCPUs}
                      onChange={(e) => setTotalvCPUs(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>vCPU Oversubscription Ratio</span>
                      <span className="font-mono text-cyan-400 font-bold">1:{oversubscription}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.5}
                      value={oversubscription}
                      onChange={(e) => setOversubscription(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                      <span>1:1 (Heavy DB)</span>
                      <span>1:2.5 (Standard App)</span>
                      <span>1:4 (VDI/Web)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Target Workload RAM</span>
                      <span className="font-mono text-indigo-400 font-bold">{targetRamGb} GB</span>
                    </div>
                    <input
                      type="range"
                      min={64}
                      max={4096}
                      step={64}
                      value={targetRamGb}
                      onChange={(e) => setTargetRamGb(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Hypervisor & Growth Buffer</span>
                      <span className="font-mono text-amber-400 font-bold">+{ramHeadroomPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={5}
                      value={ramHeadroomPct}
                      onChange={(e) => setRamHeadroomPct(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Node Configuration & High Availability</h3>
                  
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Physical Cores Per Node</label>
                    <select
                      value={coresPerNode}
                      onChange={(e) => setCoresPerNode(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value={32}>32 Cores (2x 16-Core Intel Xeon / AMD)</option>
                      <option value={48}>48 Cores (2x 24-Core Intel Xeon Gold)</option>
                      <option value={64}>64 Cores (2x 32-Core Intel Xeon Gold 6430)</option>
                      <option value={96}>96 Cores (2x 48-Core AMD EPYC)</option>
                      <option value={128}>128 Cores (2x 64-Core AMD EPYC 9554)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">RAM Installed Per Node</label>
                    <select
                      value={ramPerNodeGb}
                      onChange={(e) => setRamPerNodeGb(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value={256}>256 GB DDR5</option>
                      <option value={512}>512 GB DDR5 (Standard Enterprise)</option>
                      <option value={1024}>1,024 GB (1 TB) DDR5</option>
                      <option value={2048}>2,048 GB (2 TB) DDR5</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Redundancy / HA Architecture</label>
                    <select
                      value={computeRedundancy}
                      onChange={(e) => setComputeRedundancy(e.target.value as SizingRedundancy)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value="Standalone (1.0)">Standalone (No Node Failover)</option>
                      <option value="N+1 Redundancy">N+1 Redundancy (Standard HA Cluster)</option>
                      <option value="2N High Availability">2N High Availability (Full Mirror)</option>
                      <option value="Active-Active Cluster">Active-Active Cluster</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sizing Result Output Banner */}
              <div className="bg-gradient-to-r from-indigo-950/50 to-slate-950/80 border border-indigo-500/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-sm font-bold text-white">Recommended Cluster Topology</h4>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    {totalNodes}x Enterprise Nodes ({computeRedundancy})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Total Physical Cores</div>
                    <div className="text-lg font-bold text-white font-mono">{totalClusterCores} Cores</div>
                    <div className="text-[10px] text-emerald-400">Supports {Math.round(totalClusterCores * oversubscription)} vCPUs</div>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Total Cluster RAM</div>
                    <div className="text-lg font-bold text-white font-mono">{totalClusterRam} GB</div>
                    <div className="text-[10px] text-cyan-400">Req: {effectiveRamNeededGb} GB</div>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Datacenter Footprint</div>
                    <div className="text-lg font-bold text-white font-mono">{totalClusterRu} RU</div>
                    <div className="text-[10px] text-slate-400">{totalNodes}x 2U Chassis</div>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Nominal Power</div>
                    <div className="text-lg font-bold text-white font-mono">{totalClusterWatts} W</div>
                    <div className="text-[10px] text-amber-400">~{Math.round(totalClusterWatts / 1000 * 24 * 30)} kWh/mo</div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    id="apply-compute-calc-btn"
                    onClick={handleApplyCompute}
                    className="text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/20"
                  >
                    Apply Sizing Parameters & Justification <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORAGE SIZING */}
          {activeTab === 'Enterprise Storage (SAN/NAS)' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Capacity Growth & Workload</h3>
                  
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Initial Usable Capacity</span>
                      <span className="font-mono text-cyan-400 font-bold">{usableCapacityTb} TB</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={300}
                      step={5}
                      value={usableCapacityTb}
                      onChange={(e) => setUsableCapacityTb(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Annual Data Growth</span>
                      <span className="font-mono text-indigo-400 font-bold">{annualGrowthPct}% / Year</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={5}
                      value={annualGrowthPct}
                      onChange={(e) => setAnnualGrowthPct(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Projection Horizon</label>
                    <select
                      value={projectionYears}
                      onChange={(e) => setProjectionYears(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value={3}>3-Year TCO Horizon</option>
                      <option value={5}>5-Year TCO Horizon</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Data Reduction & IOPS Sizing</h3>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">RAID / Erasure Coding Protection</label>
                    <select
                      value={raidType}
                      onChange={(e) => setRaidType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value="Erasure Coding 4+2">Erasure Coding 4+2 (Enterprise Recommended)</option>
                      <option value="RAID 6">RAID 6 (Dual Parity)</option>
                      <option value="RAID 10">RAID 10 (Striped Mirrors - High IOPS)</option>
                      <option value="RAID 5">RAID 5 (Single Parity)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Deduplication & Compression Ratio (DRR)</span>
                      <span className="font-mono text-emerald-400 font-bold">{dedupRatio}:1 DRR</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.5}
                      value={dedupRatio}
                      onChange={(e) => setDedupRatio(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                      <span>1:1 (Encrypted/Media)</span>
                      <span>3:1 (VMware/SQL)</span>
                      <span>5:1 (VDI/Virtual Desktops)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Target Workload IOPS</span>
                      <span className="font-mono text-amber-400 font-bold">{iopsTarget.toLocaleString()} IOPS</span>
                    </div>
                    <input
                      type="range"
                      min={20000}
                      max={500000}
                      step={20000}
                      value={iopsTarget}
                      onChange={(e) => setIopsTarget(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Storage Result Banner */}
              <div className="bg-gradient-to-r from-cyan-950/50 to-slate-950/80 border border-cyan-500/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-sm font-bold text-white">Recommended Storage Specification</h4>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                    {rawStorageRequiredTb} TB Raw All-NVMe Flash Array
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Year-{projectionYears} Usable Needed</div>
                    <div className="text-lg font-bold text-white font-mono">{Math.round(futureUsableTb)} TB</div>
                    <div className="text-[10px] text-indigo-400">Base: {usableCapacityTb} TB</div>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Effective Flash Capacity</div>
                    <div className="text-lg font-bold text-white font-mono">{Math.round(rawStorageRequiredTb * dedupRatio)} TB</div>
                    <div className="text-[10px] text-emerald-400">@{dedupRatio}:1 Data Reduction</div>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Target IOPS Capability</div>
                    <div className="text-lg font-bold text-white font-mono">{iopsTarget.toLocaleString()}</div>
                    <div className="text-[10px] text-cyan-400">&lt; 0.5ms NVMe-oF Latency</div>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Protection Topology</div>
                    <div className="text-sm font-bold text-white font-mono">{raidType}</div>
                    <div className="text-[10px] text-amber-400">Dual Active-Active</div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    id="apply-storage-calc-btn"
                    onClick={handleApplyStorage}
                    className="text-xs font-semibold px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-cyan-600/20"
                  >
                    Apply Storage Sizing <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NETWORK & FIREWALL */}
          {activeTab === 'Next-Gen Firewall & Security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Perimeter & East-West Throughput</h3>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Peak Throughput Requirement</span>
                      <span className="font-mono text-emerald-400 font-bold">{throughputGbps} Gbps</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={100}
                      step={2}
                      value={throughputGbps}
                      onChange={(e) => setThroughputGbps(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Concurrent Active Sessions</span>
                      <span className="font-mono text-cyan-400 font-bold">{concurrentSessions.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={500000}
                      max={10000000}
                      step={500000}
                      value={concurrentSessions}
                      onChange={(e) => setConcurrentSessions(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Security & Port Density</h3>
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-white">Full SSL/TLS Inspection</div>
                      <div className="text-[10px] text-slate-400">Enables deep malware & exploit inspection (+40% CPU overhead)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={sslInspection}
                      onChange={(e) => setSslInspection(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-800"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Connected Server Nodes (Dual 25G)</span>
                      <span className="font-mono text-indigo-400 font-bold">{serverCount25G} Servers ({serverCount25G * 2} Ports)</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={32}
                      step={2}
                      value={serverCount25G}
                      onChange={(e) => setServerCount25G(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="apply-network-calc-btn"
                  onClick={handleApplyNetwork}
                  className="text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  Apply Network / Security Sizing <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & DR */}
          {activeTab === 'Backup & Disaster Recovery' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Protected Workloads & Change Rates</h3>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Protected Source Workload Data</span>
                      <span className="font-mono text-amber-400 font-bold">{protectedDataTb} TB</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={200}
                      step={5}
                      value={protectedDataTb}
                      onChange={(e) => setProtectedDataTb(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Daily Incremental Change Rate</span>
                      <span className="font-mono text-indigo-400 font-bold">{dailyChangePct}% / Day</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      step={1}
                      value={dailyChangePct}
                      onChange={(e) => setDailyChangePct(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Retention & Appliance Deduplication</h3>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>On-Prem Immutable Retention</span>
                      <span className="font-mono text-cyan-400 font-bold">{retentionDaysLocal} Days</span>
                    </div>
                    <input
                      type="range"
                      min={7}
                      max={90}
                      step={7}
                      value={retentionDaysLocal}
                      onChange={(e) => setRetentionDaysLocal(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Appliance Deduplication Factor</span>
                      <span className="font-mono text-emerald-400 font-bold">{backupDedupRatio}:1</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={25}
                      step={1}
                      value={backupDedupRatio}
                      onChange={(e) => setBackupDedupRatio(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Calculated Backup Storage Repository Needed</div>
                  <div className="text-lg font-bold text-white font-mono">{usableBackupRepoTb} TB Usable Target Repository</div>
                  <div className="text-[10px] text-emerald-400">Stores {totalRawBackupTb} TB logical recovery points with {retentionDaysLocal}-day immutable retention</div>
                </div>
                <button
                  id="apply-backup-calc-btn"
                  onClick={handleApplyBackup}
                  className="text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  Apply Backup Sizing <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Formula: N+1 Node Clustering & Dynamic DRR Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
