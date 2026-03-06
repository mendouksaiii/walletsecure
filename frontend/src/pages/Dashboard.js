import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
    Wallet, ShieldCheck, AlertTriangle, Activity,
    Copy, ChevronRight, RefreshCw,
    Shield, Database, Loader2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { dashboardService, scanService } from '../services/api';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    })
};

const sidebarItems = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "wallets", label: "My Wallets", icon: Wallet },
    { id: "alerts", label: "Alerts", icon: AlertTriangle },
];

/* ── Spinner ── */
function LoadingState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-foreground-muted text-sm">{message || "Loading..."}</p>
        </div>
    );
}

/* ── Connect Wallet Prompt ── */
function ConnectPrompt() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/15 flex items-center justify-center mb-6">
                <Wallet className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">Connect Your Wallet</h2>
            <p className="text-foreground-muted text-sm max-w-md mb-6">
                Connect your wallet using the button in the top-right corner to view your personalized security dashboard with real on-chain data.
            </p>
        </div>
    );
}

/* ── Chart Tooltip ── */
function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface border border-white/[0.08] rounded-xl p-3 shadow-xl backdrop-blur-xl">
                <p className="text-xs font-mono text-foreground-muted mb-1.5">{label}</p>
                {payload.map((entry, i) => (
                    <p key={i} className="text-xs font-mono font-bold" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
}

/* ── Overview Tab ── */
function OverviewContent({ walletData, scanResult, isLoading }) {
    if (isLoading) return <LoadingState message="Loading wallet data..." />;

    const securityScore = scanResult?.security_score ?? scanResult?.risk_score ?? 100;
    const riskLevel = scanResult?.risk_level || 'safe';
    const findings = scanResult?.risks_found || scanResult?.findings || [];

    const statCards = [
        {
            title: "ETH Balance",
            value: walletData?.eth_balance || "0 ETH",
            sub: walletData?.eth_usd || "$0.00",
            icon: Wallet,
            gradient: "from-emerald-500/20 to-emerald-500/5"
        },
        {
            title: "Security Score",
            value: `${securityScore}/100`,
            sub: riskLevel === 'safe' ? 'Healthy' : riskLevel === 'low' ? 'Low risk' : 'Action needed',
            icon: ShieldCheck,
            gradient: "from-cyan-500/20 to-cyan-500/5"
        },
        {
            title: "Active Approvals",
            value: String(walletData?.total_approvals ?? 0),
            sub: walletData?.risky_approvals > 0 ? `${walletData.risky_approvals} risky` : "All verified",
            icon: AlertTriangle,
            gradient: "from-red-500/20 to-red-500/5",
            urgent: (walletData?.risky_approvals ?? 0) > 0
        },
        {
            title: "Transactions",
            value: walletData?.tx_count?.toLocaleString() ?? "0",
            sub: `${walletData?.token_count ?? 0} tokens held`,
            icon: Database,
            gradient: "from-violet-500/20 to-violet-500/5"
        },
    ];

    // Build chart data from scan history if available
    const chartData = (walletData?.scan_history || []).slice(0, 7).reverse().map((scan, i) => {
        const date = scan.scan_timestamp ? new Date(scan.scan_timestamp) : new Date();
        return {
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            score: scan.security_score ?? 100,
            risks: scan.risks_found?.length ?? 0,
        };
    });

    // Alert preview from scan findings
    const recentAlerts = findings.map((f, i) => ({
        id: i + 1,
        title: f.risk_type || f.type || "Security Finding",
        time: "Latest scan",
        type: (f.risk_level === 'critical' || f.risk_level === 'high' || f.severity === 'critical' || f.severity === 'high') ? "risk" : "neutral",
        desc: f.description,
        read: false,
    }));

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={i} custom={i + 1} variants={fadeUp} initial="hidden" animate="visible">
                            <Card variant="grid" className={`h-full group relative overflow-hidden ${stat.urgent ? 'border-destructive/30 hover:border-destructive/50' : 'border-white/[0.06] hover:border-white/[0.12]'} transition-all duration-300`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                <div className="p-5 space-y-3 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <span className="data-label uppercase tracking-wider text-[10px]">{stat.title}</span>
                                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:border-white/[0.12] transition-all duration-300 group-hover:shadow-lg">
                                            <Icon className={`w-4 h-4 ${stat.urgent ? 'text-destructive' : 'text-primary'}`} />
                                        </div>
                                    </div>
                                    <p className={`font-mono font-bold text-3xl ${stat.urgent ? 'text-destructive' : 'text-foreground-DEFAULT'}`}>
                                        {stat.value}
                                    </p>
                                    <p className={`text-xs ${stat.urgent ? 'text-destructive/70' : 'text-foreground-muted'}`}>
                                        {stat.sub}
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Charts + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2">
                    <Card variant="grid" className="h-full border-white/[0.06]">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Security Score History</CardTitle>
                                    <CardDescription>Score trend from recent scans</CardDescription>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-mono">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(0,229,153,0.5)]" /> Score</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_6px_rgba(239,68,68,0.5)]" /> Risks</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {chartData.length > 0 ? (
                                <div className="h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="name" stroke="#3F3F46" fontSize={11} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                                            <YAxis stroke="#3F3F46" fontSize={11} tickLine={false} axisLine={false} fontFamily="IBM Plex Mono" />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
                                            <Line type="monotone" dataKey="score" stroke="#00E599" strokeWidth={2} dot={false}
                                                activeDot={{ r: 5, fill: '#00E599', stroke: '#08080A', strokeWidth: 2 }} />
                                            <Line type="monotone" dataKey="risks" stroke="#EF4444" strokeWidth={2} dot={false}
                                                activeDot={{ r: 5, fill: '#EF4444', stroke: '#08080A', strokeWidth: 2 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <Activity className="w-10 h-10 text-foreground-subtle mb-3" />
                                    <p className="text-foreground-muted text-sm">Scan your wallet to start tracking security trends.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Alerts Preview */}
                <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
                    <Card variant="grid" className="h-full flex flex-col border-white/[0.06]">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Recent Findings</CardTitle>
                                {recentAlerts.length > 0 && (
                                    <Badge variant="risk" className="text-[10px]">{recentAlerts.length} found</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 relative">
                            {recentAlerts.length > 0 ? (
                                <div className="absolute inset-x-0 top-0 bottom-0 overflow-y-auto px-6 pb-6 space-y-2.5">
                                    {recentAlerts.slice(0, 5).map((alert, i) => (
                                        <div key={i} className="flex gap-3 p-3 rounded-xl border border-primary/20 bg-primary/[0.03] hover:border-primary/30 transition-all duration-200 group cursor-pointer">
                                            <div className="mt-0.5">
                                                {alert.type === "risk" ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
                                                    <Activity className="w-4 h-4 text-foreground-subtle" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h5 className="text-sm font-semibold truncate">{alert.title}</h5>
                                                    <span className="text-[10px] font-mono text-foreground-subtle shrink-0 ml-2">{alert.time}</span>
                                                </div>
                                                <p className="text-xs text-foreground-muted line-clamp-2">{alert.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <ShieldCheck className="w-10 h-10 text-primary mb-3" />
                                    <p className="text-foreground-muted text-sm">No threats detected. Your wallet looks clean.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </>
    );
}

/* ── Wallets Tab ── */
function WalletsContent({ walletData, address, isLoading, onScan }) {
    if (isLoading) return <LoadingState message="Loading wallet data..." />;

    const copyAddress = (addr) => {
        navigator.clipboard.writeText(addr);
        toast.success("Address copied to clipboard");
    };

    const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
    const riskScore = walletData?.latest_scan?.security_score ?? 0;
    const riskColor = riskScore >= 80 ? 'text-primary' : riskScore >= 50 ? 'text-yellow-400' : 'text-destructive';
    const riskBg = riskScore >= 80 ? 'bg-primary/10 border-primary/20' : riskScore >= 50 ? 'bg-yellow-400/10 border-yellow-400/20' : 'bg-destructive/10 border-destructive/20';
    const lastScanTime = walletData?.latest_scan?.scan_timestamp
        ? new Date(walletData.latest_scan.scan_timestamp).toLocaleString()
        : "Never";

    const wallets = address ? [{
        name: "Connected Wallet",
        address: shortAddr,
        fullAddress: address,
        balance: walletData?.eth_balance || "0 ETH",
        usdValue: walletData?.eth_usd || "$0.00",
        lastScan: lastScanTime,
        riskScore: riskScore,
        approvals: walletData?.total_approvals ?? 0,
        monitoring: false,
    }] : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                className="flex items-center justify-between">
                <div>
                    <h2 className="font-display font-bold text-xl">Connected Wallets</h2>
                    <p className="text-foreground-muted text-sm mt-1">Manage and monitor your wallet portfolio</p>
                </div>
            </motion.div>

            {/* Wallet Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {wallets.map((wallet, i) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp} initial="hidden" animate="visible">
                        <Card variant="grid" className="group border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 overflow-hidden relative">
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                            <div className="p-5 space-y-4 relative z-10">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                                            <Wallet className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm">{wallet.name}</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-mono text-foreground-muted">{wallet.address}</span>
                                                <button onClick={() => copyAddress(wallet.fullAddress)} className="text-foreground-subtle hover:text-primary transition-colors">
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {wallet.riskScore > 0 && (
                                        <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${riskBg} ${riskColor}`}>
                                            {wallet.riskScore}/100
                                        </div>
                                    )}
                                </div>

                                {/* Balance */}
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-mono font-bold">{wallet.balance}</span>
                                    <span className="text-sm text-foreground-muted">≈ {wallet.usdValue}</span>
                                </div>

                                {/* Stats grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                                        <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Approvals</p>
                                        <p className="font-mono font-bold text-sm mt-0.5">{wallet.approvals}</p>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                                        <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Last Scan</p>
                                        <p className="font-mono text-xs mt-0.5 text-foreground-muted">{wallet.lastScan}</p>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                                        <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Tokens</p>
                                        <p className="font-mono font-bold text-sm mt-0.5">{walletData?.token_count ?? 0}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-1">
                                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={onScan}>
                                        <Search className="w-3 h-3" /> Scan Now
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5">
                                        <Eye className="w-3 h-3" /> View
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ── Alerts Tab ── */
function AlertsContent({ scanResult, isLoading }) {
    const [filter, setFilter] = useState("all");

    if (isLoading) return <LoadingState message="Loading alerts..." />;

    const findings = scanResult?.risks_found || scanResult?.findings || [];
    const approvals = scanResult?.approvals || [];

    // Build alerts from real scan findings + approval data
    const alerts = [
        ...findings.map((f, i) => ({
            id: `finding-${i}`,
            title: f.risk_type || f.type || "Security Finding",
            time: "Latest scan",
            type: (f.risk_level === 'critical' || f.risk_level === 'high' || f.severity === 'critical' || f.severity === 'high') ? "risk" : "neutral",
            desc: f.description || f.recommended_action || "Review this finding.",
            read: false,
        })),
        ...approvals.filter(a => a.is_unlimited).map((a, i) => ({
            id: `approval-${i}`,
            title: "Unlimited Approval",
            time: "Active",
            type: a.is_risky ? "risk" : "neutral",
            desc: `${a.token_symbol || 'Token'} has unlimited approval granted to ${a.spender_name || 'unknown contract'}.`,
            read: false,
        })),
    ];

    // If no alerts at all, show the 'all clear'
    if (alerts.length === 0) {
        alerts.push({
            id: "clear",
            title: "All Clear",
            time: "Now",
            type: "safe",
            desc: "No security issues found. Your wallet looks healthy.",
            read: true,
        });
    }

    const filteredAlerts = filter === "all" ? alerts :
        filter === "unread" ? alerts.filter(a => !a.read) :
            alerts.filter(a => a.type === filter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="font-display font-bold text-xl">Security Alerts</h2>
                    <p className="text-foreground-muted text-sm mt-1">
                        {alerts.filter(a => !a.read).length} unread alerts
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs"
                        onClick={() => toast.success("All alerts marked as read")}>
                        <ShieldCheck className="w-3 h-3 mr-1.5" /> Mark All Read
                    </Button>
                </div>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
                className="flex gap-2 flex-wrap">
                {[
                    { id: "all", label: "All" },
                    { id: "unread", label: "Unread" },
                    { id: "risk", label: "Threats" },
                    { id: "safe", label: "Safe" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${filter === tab.id
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-white/[0.02] text-foreground-muted border-white/[0.06] hover:border-white/[0.1] hover:text-foreground-DEFAULT'
                            }`}
                    >
                        {tab.label}
                        {tab.id === "unread" && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-mono">
                                {alerts.filter(a => !a.read).length}
                            </span>
                        )}
                    </button>
                ))}
            </motion.div>

            {/* Alert List */}
            <div className="space-y-3">
                {filteredAlerts.length === 0 ? (
                    <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
                        className="flex flex-col items-center justify-center py-16 text-center">
                        <Shield className="w-12 h-12 text-foreground-subtle mb-4" />
                        <p className="text-foreground-muted">No alerts match this filter</p>
                    </motion.div>
                ) : (
                    filteredAlerts.map((alert, i) => (
                        <motion.div key={alert.id} custom={i + 2} variants={fadeUp} initial="hidden" animate="visible">
                            <Card variant="grid" className={`group cursor-pointer transition-all duration-300 overflow-hidden ${!alert.read
                                ? 'border-primary/15 hover:border-primary/25 bg-primary/[0.02]'
                                : 'border-white/[0.04] hover:border-white/[0.08]'
                                }`}>
                                <div className="p-4 flex gap-4 items-start">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.type === 'risk'
                                        ? 'bg-destructive/10 border border-destructive/20'
                                        : alert.type === 'safe'
                                            ? 'bg-primary/10 border border-primary/20'
                                            : 'bg-white/[0.03] border border-white/[0.06]'
                                        }`}>
                                        {alert.type === "risk" ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
                                            alert.type === "safe" ? <ShieldCheck className="w-4 h-4 text-primary" /> :
                                                <Activity className="w-4 h-4 text-foreground-subtle" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <h5 className="text-sm font-semibold">{alert.title}</h5>
                                                {!alert.read && <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(0,229,153,0.4)]" />}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-foreground-subtle">{alert.time}</span>
                                                <Badge variant={alert.type === 'risk' ? 'risk' : alert.type === 'safe' ? 'safe' : 'default'} className="text-[10px]">
                                                    {alert.type === 'risk' ? 'THREAT' : alert.type === 'safe' ? 'SAFE' : 'INFO'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <p className="text-xs text-foreground-muted">{alert.desc}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-foreground-subtle opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

/* ── Main Dashboard ── */
export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [address, setAddress] = useState(null);
    const [walletData, setWalletData] = useState(null);
    const [scanResult, setScanResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Read wallet address from localStorage
    useEffect(() => {
        const savedAddress = localStorage.getItem('walletsecure_address');
        if (savedAddress) {
            setAddress(savedAddress);
        } else {
            setIsLoading(false);
        }
    }, []);

    // Fetch real data when address is available
    const fetchData = useCallback(async () => {
        if (!address) return;
        setIsLoading(true);
        try {
            // Fetch wallet info (balance, approvals, scan history)
            const info = await dashboardService.getWalletInfo(address);
            setWalletData(info);

            // If there's a latest scan in history, use it
            if (info.latest_scan) {
                setScanResult(info.latest_scan);
            }

            // Also run a fresh scan to get up-to-date findings
            try {
                const scan = await scanService.scanWallet(address, 'ethereum');
                setScanResult(scan);
            } catch (scanErr) {
                console.warn("Auto-scan failed, using cached data:", scanErr);
            }
        } catch (error) {
            console.error("Dashboard data fetch error:", error);
            toast.error("Failed to load wallet data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Manual re-scan handler
    const handleRefresh = () => {
        fetchData();
        toast.success("Refreshing wallet data...");
    };

    const alertCount = (scanResult?.risks_found || scanResult?.findings || []).length +
        (walletData?.approvals || []).filter(a => a.is_unlimited).length;

    // No wallet connected
    if (!address && !isLoading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex h-[calc(100vh-80px)] overflow-hidden">
                <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
                    <ConnectPrompt />
                </main>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex h-[calc(100vh-80px)] overflow-hidden"
        >
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-64 border-r border-white/[0.06] bg-[#0a0a0d] p-5 shrink-0">
                <div className="space-y-1 mb-8">
                    <p className="data-label mb-4 px-3 uppercase tracking-wider text-[10px]">Navigation</p>
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/15 shadow-[0_0_12px_rgba(0,229,153,0.06)]'
                                    : 'text-foreground-muted hover:bg-white/[0.03] hover:text-foreground-DEFAULT border border-transparent'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="font-medium">{item.label}</span>
                                {item.id === "alerts" && alertCount > 0 && (
                                    <span className="ml-auto w-5 h-5 rounded-full bg-destructive/20 text-destructive text-xs font-mono flex items-center justify-center">{alertCount}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Wallet Summary Card */}
                {address && (
                    <div className="mt-auto">
                        <Card variant="glass" className="p-4 border-primary/15 group cursor-pointer hover:border-primary/30 transition-all bg-primary/[0.02]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:shadow-[0_0_12px_rgba(0,229,153,0.15)] transition-shadow">
                                    <Wallet className="w-4 h-4 text-primary" />
                                </div>
                                <Badge variant="safe">Connected</Badge>
                            </div>
                            <p className="font-mono text-xs text-foreground-muted truncate">{address}</p>
                            <p className="font-mono font-bold text-sm text-primary mt-1">{walletData?.eth_balance || "..."}</p>
                        </Card>
                    </div>
                )}
            </aside>

            {/* Mobile Tab Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0d] border-t border-white/[0.06] flex">
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-foreground-muted'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Main */}
            <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto pb-20 md:pb-10">
                {/* Header */}
                <motion.header custom={0} variants={fadeUp} initial="hidden" animate="visible"
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
                >
                    <div>
                        <h1 className="font-display font-bold text-display-sm mb-1">
                            {activeTab === "overview" ? "Security Overview" : activeTab === "wallets" ? "My Wallets" : "Alert Center"}
                        </h1>
                        <p className="text-foreground-muted text-sm">
                            {activeTab === "overview" ? "Monitor your assets and network threats." :
                                activeTab === "wallets" ? "Track and manage your connected wallets." :
                                    "Review and respond to security notifications."}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                    </div>
                </motion.header>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                    >
                        {activeTab === "overview" && <OverviewContent walletData={walletData} scanResult={scanResult} isLoading={isLoading} />}
                        {activeTab === "wallets" && <WalletsContent walletData={walletData} address={address} isLoading={isLoading} onScan={handleRefresh} />}
                        {activeTab === "alerts" && <AlertsContent scanResult={{ ...scanResult, approvals: walletData?.approvals }} isLoading={isLoading} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </motion.div>
    );
}
