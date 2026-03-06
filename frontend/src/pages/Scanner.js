import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ScanEye, CheckCircle, ShieldAlert, Loader2, Terminal, Crosshair, Fingerprint } from "lucide-react";
import { scanService } from "../services/api";
import { toast } from "sonner";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    })
};

/* ── Animated SVG risk gauge ── */
function RiskGauge({ score, level }) {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    // High score = safe (green), low score = dangerous (red)
    const color = score >= 80 ? '#00E599' : score >= 50 ? '#F59E0B' : '#EF4444';
    const glowColor = score >= 80 ? 'rgba(0,229,153,0.3)' : score >= 50 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';

    // Derive display label from actual score
    const displayLevel = score >= 80 ? 'Safe' : score >= 50 ? 'Moderate Risk' : score >= 30 ? 'High Risk' : 'Critical Risk';
    const displayMessage = score >= 80 ? 'Your wallet looks healthy' : score >= 50 ? 'Review recommended' : 'Immediate action required';

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                    {/* Background arc */}
                    <circle cx="90" cy="90" r={radius} fill="none"
                        stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                    {/* Animated score arc */}
                    <motion.circle
                        cx="90" cy="90" r={radius} fill="none"
                        stroke={color} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - progress }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                        style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
                    />
                </svg>
                {/* Center score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatedNumber value={score} className="font-mono font-bold text-5xl" style={{ color }} />
                    <span className="data-label mt-1">/ 100</span>
                </div>
            </div>
            <div className="text-center space-y-1">
                <p className="font-display font-semibold text-lg" style={{ color }}>
                    {displayLevel}
                </p>
                <p className="text-xs text-foreground-muted">
                    {displayMessage}
                </p>
            </div>
        </div>
    );
}

/* ── Animated number counter ── */
function AnimatedNumber({ value, className, style }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = value / 30;
        const timer = setInterval(() => {
            start += step;
            if (start >= value) { setDisplay(value); clearInterval(timer); }
            else setDisplay(Math.floor(start));
        }, 30);
        return () => clearInterval(timer);
    }, [value]);
    return <span className={className} style={style}>{display}</span>;
}

export default function Scanner() {
    const [address, setAddress] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [revokingContract, setRevokingContract] = useState(null);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!address) { toast.error("Please enter a wallet address"); return; }

        setIsScanning(true);
        setScanResult(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const raw = await scanService.scanWallet(address, 'ethereum');
            // Normalize backend response keys to what the UI expects
            const result = {
                ...raw,
                risk_score: raw.security_score ?? raw.risk_score ?? 0,
                risk_level: raw.risk_level || 'low',
                findings: raw.risks_found || raw.findings || [],
                total_approvals: raw.total_approvals || 0,
                high_risk_approvals: raw.risky_approvals || raw.high_risk_approvals || 0,
            };
            setScanResult(result);
            toast.success("Scan completed successfully");
        } catch (error) {
            console.error("Scan error:", error);
            toast.error(error.response?.data?.detail || "Failed to scan wallet. Please try again.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleRevoke = async (tokenAddress, spenderAddress) => {
        if (!tokenAddress || !spenderAddress) return;
        setRevokingContract(spenderAddress);
        try {
            const payload = await scanService.revokeApproval(address, tokenAddress, spenderAddress, 'ethereum');

            if (!window.ethereum) throw new Error("No wallet detected");

            // Format value correctly for eth_sendTransaction (must be hex)
            const txValue = payload.value ? '0x' + Number(payload.value).toString(16) : '0x0';

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: address,
                    to: payload.to,
                    data: payload.data,
                    value: txValue
                }]
            });

            toast.success(`Revocation submitted! Hash: ${txHash.slice(0, 10)}...`);
            setTimeout(() => { document.getElementById("scan-btn")?.click(); }, 5000);
        } catch (error) {
            console.error("Revoke error:", error);
            toast.error(error.message || "Failed to execute revocation");
        } finally { setRevokingContract(null); }
    };

    const severityConfig = {
        critical: { variant: "risk", label: "CRITICAL", dotClass: "status-dot--danger" },
        high: { variant: "risk", label: "HIGH", dotClass: "status-dot--danger" },
        medium: { variant: "warning", label: "MEDIUM", dotClass: "status-dot--warning" },
        low: { variant: "safe", label: "LOW", dotClass: "status-dot--safe" },
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="max-w-5xl mx-auto px-6 py-16 space-y-12"
        >
            {/* Header */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Crosshair className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-display-sm">Deep Wallet Audit</h1>
                    </div>
                </div>
                <p className="text-foreground-muted max-w-xl">
                    Enter any EVM address or ENS name to analyze approvals, detect malicious contracts, and evaluate risk.
                </p>
            </motion.div>

            {/* Search bar */}
            <motion.form custom={1} variants={fadeUp} initial="hidden" animate="visible"
                onSubmit={handleScan} className="relative"
            >
                <Card variant="terminal" className="p-1.5">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
                            <Input
                                placeholder="0x... or ENS name"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="pl-11 h-12 border-0 bg-transparent focus:ring-0 focus:shadow-none"
                            />
                        </div>
                        <Button id="scan-btn" type="submit" size="lg" disabled={isScanning}
                            className="h-12 px-8 shrink-0"
                        >
                            {isScanning ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</>
                            ) : (
                                <><ScanEye className="w-4 h-4 mr-2" /> Scan Now</>
                            )}
                        </Button>
                    </div>
                    {/* Scan sweep animation */}
                    {isScanning && <div className="scan-sweep rounded-lg" />}
                </Card>
            </motion.form>

            {/* Results */}
            <AnimatePresence>
                {scanResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-8"
                    >
                        {/* Score + Details */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Risk Gauge */}
                            <Card variant="grid" className="md:col-span-5 flex items-center justify-center p-8">
                                <RiskGauge score={scanResult.risk_score ?? 0} level={scanResult.risk_level ?? 'low'} />
                            </Card>

                            {/* Details */}
                            <Card variant="grid" className="md:col-span-7">
                                <div className="p-6 space-y-6">
                                    <div>
                                        <span className="data-label">Target Address</span>
                                        <p className="font-mono text-sm text-foreground-DEFAULT mt-1 break-all">
                                            {scanResult.wallet_address}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-background/60 border border-border space-y-1">
                                            <span className="data-label">Total Approvals</span>
                                            <p className="font-mono font-bold text-2xl">
                                                <AnimatedNumber value={scanResult.total_approvals} className="font-mono font-bold text-2xl text-foreground-DEFAULT" />
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-destructive-muted border border-destructive/20 space-y-1">
                                            <span className="data-label text-destructive/70">High Risk</span>
                                            <p className="font-mono font-bold text-2xl text-destructive">
                                                <AnimatedNumber value={scanResult.high_risk_approvals} className="font-mono font-bold text-2xl text-destructive" />
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Fingerprint className="w-4 h-4 text-foreground-subtle" />
                                        <span className="text-xs text-foreground-muted">Chain: <span className="text-foreground-DEFAULT font-mono">{scanResult.chain}</span></span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Findings */}
                        {scanResult.findings && scanResult.findings.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <ShieldAlert className="w-5 h-5 text-destructive" />
                                    <h2 className="font-display font-semibold text-xl">Security Findings</h2>
                                    <Badge variant="risk">{scanResult.findings.length} found</Badge>
                                </div>

                                <div className="space-y-3 stagger-children">
                                    {scanResult.findings.map((finding, i) => {
                                        const config = severityConfig[finding.severity] || severityConfig.medium;
                                        return (
                                            <Card key={i} variant={finding.severity === 'critical' ? 'danger' : 'grid'}
                                                className="group"
                                            >
                                                <div className="p-5 flex flex-col sm:flex-row items-start gap-4">
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant={config.variant}>{config.label}</Badge>
                                                            <h4 className="font-display font-semibold">{finding.type}</h4>
                                                        </div>
                                                        <p className="text-sm text-foreground-muted">{finding.description}</p>
                                                        {finding.contract_address && (
                                                            <p className="font-mono text-xs text-foreground-subtle bg-background-elevated px-3 py-1.5 rounded-lg inline-block border border-border">
                                                                {finding.contract_address}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="danger" size="sm"
                                                        className="shrink-0 mt-2 sm:mt-0"
                                                        onClick={() => handleRevoke(finding.token_address, finding.contract_address)}
                                                        disabled={revokingContract === finding.contract_address}
                                                    >
                                                        {revokingContract === finding.contract_address ? (
                                                            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Revoking...</>
                                                        ) : (
                                                            <><ShieldAlert className="w-3 h-3 mr-1.5" /> Revoke</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* All clear */}
                        {scanResult.findings && scanResult.findings.length === 0 && (
                            <Card variant="glass" className="border-primary/20">
                                <div className="p-8 flex flex-col items-center text-center space-y-3">
                                    <CheckCircle className="w-12 h-12 text-primary" />
                                    <h3 className="font-display font-semibold text-xl">All Clear</h3>
                                    <p className="text-foreground-muted">No security issues found. Your wallet looks healthy.</p>
                                </div>
                            </Card>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
