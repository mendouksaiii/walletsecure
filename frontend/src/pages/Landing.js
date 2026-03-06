import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
    ScanEye, Lock, AlertTriangle, Zap, ArrowRight, Shield, Radio, Eye,
    CheckCircle, Cpu, Layers, Fingerprint, ChevronRight,
    Sparkles, Target, Users, Clock, Blocks
} from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    })
};


function AnimatedCounter({ target, suffix = "" }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    let start = 0;
                    const step = target / 40;
                    const interval = setInterval(() => {
                        start += step;
                        if (start >= target) {
                            setCount(target);
                            clearInterval(interval);
                        } else {
                            setCount(Math.floor(start));
                        }
                    }, 30);
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Animated glow orb ── */
function GlowOrb({ color, size, top, left, right, bottom, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, delay, ease: "easeOut" }}
            className="absolute rounded-full pointer-events-none"
            style={{
                width: size, height: size, top, left, right, bottom,
                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                filter: 'blur(80px)',
            }}
        />
    );
}

const features = [
    {
        icon: ScanEye,
        title: "Deep Contract Analysis",
        desc: "Our engine decodes bytecode, detects honeypots, identifies rug-pull patterns, and maps approval chains across every major EVM network.",
        color: "#00E599",
        gradient: "from-emerald-500/20 to-emerald-500/5",
    },
    {
        icon: Lock,
        title: "Approval Management",
        desc: "Instantly identify unlimited ERC-20 token approvals and revoke dangerous permissions with a single click — no code required.",
        color: "#6366F1",
        gradient: "from-indigo-500/20 to-indigo-500/5",
    },
    {
        icon: AlertTriangle,
        title: "Threat Intelligence",
        desc: "Real-time alerts via Telegram and Email when suspicious activity targets your wallets. Our AI monitors 24/7 so you don't have to.",
        color: "#EF4444",
        gradient: "from-red-500/20 to-red-500/5",
    },
];

const howItWorks = [
    {
        step: "01",
        title: "Connect Your Wallet",
        desc: "Link your MetaMask, Rabby, or any EVM-compatible wallet. We never ask for private keys — we only read public on-chain data.",
        icon: Fingerprint,
        color: "#00E599",
    },
    {
        step: "02",
        title: "Run a Security Scan",
        desc: "Our engine analyzes every token approval, contract interaction, and transaction pattern. Results appear in under 30 seconds.",
        icon: Target,
        color: "#6366F1",
    },
    {
        step: "03",
        title: "Review & Revoke",
        desc: "See your risk score, detailed findings, and one-click revoke buttons for any dangerous approvals. Take immediate action.",
        icon: Shield,
        color: "#F59E0B",
    },
    {
        step: "04",
        title: "Enable Monitoring",
        desc: "Upgrade to Premium for 24/7 continuous monitoring. Get instant alerts when new threats target your wallets.",
        icon: Radio,
        color: "#EF4444",
    },
];

const stats = [
    { value: 14200, label: "Contracts Scanned", suffix: "+", icon: Blocks },
    { value: 847, label: "Threats Blocked", suffix: "", icon: Shield },
    { value: 99.9, label: "Uptime", suffix: "%", icon: Clock },
    { value: 2400, label: "Active Users", suffix: "+", icon: Users },
];

const supportedChains = [
    { name: "Ethereum", color: "#627EEA" },
    { name: "Polygon", color: "#8247E5" },
    { name: "Arbitrum", color: "#28A0F0" },
    { name: "Optimism", color: "#FF0420" },
    { name: "Base", color: "#0052FF" },
    { name: "BSC", color: "#F0B90B" },
];

const faqs = [
    {
        q: "Is WalletSecure safe to use?",
        a: "Absolutely. We never request your private keys or seed phrase. WalletSecure only reads publicly available on-chain data. All wallet signing is done through your own wallet provider."
    },
    {
        q: "What blockchains do you support?",
        a: "We support all major EVM chains including Ethereum, Polygon, Arbitrum, Optimism, Base, and BSC. More chains are being added regularly."
    },
    {
        q: "How does the risk score work?",
        a: "Our AI analyzes your token approvals, contract interactions, and transaction patterns, then assigns a score from 0-100. Higher scores indicate more risk factors detected."
    },
    {
        q: "What does revoking an approval do?",
        a: "Revoking removes a smart contract's permission to spend your tokens. This protects you from malicious contracts draining your wallet — even ones you approved months ago."
    },
];

export default function Landing() {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col w-full"
        >
            {/* ===== HERO ===== */}
            <section className="min-h-[95vh] flex items-center relative overflow-hidden">
                {/* Animated gradient orbs */}
                <GlowOrb color="rgba(0,229,153,0.08)" size="700px" top="-20%" left="-10%" delay={0} />
                <GlowOrb color="rgba(99,102,241,0.06)" size="500px" top="10%" right="-5%" delay={0.3} />
                <GlowOrb color="rgba(239,68,68,0.04)" size="400px" bottom="-10%" left="30%" delay={0.6} />

                {/* Animated grid lines */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(0,229,153,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,153,0.3) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }} />

                <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center relative z-10">
                    {/* Left — Copy */}
                    <div className="lg:col-span-7 space-y-8">
                        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/[0.05] text-primary text-xs font-mono uppercase tracking-widest backdrop-blur-sm">
                                <Zap className="w-3 h-3" />
                                Web3 Threat Intelligence Platform
                            </span>
                        </motion.div>

                        <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
                            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-[0.92] tracking-tighter"
                        >
                            Protect your
                            <br />
                            <span className="relative">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400">
                                    digital wealth.
                                </span>
                                {/* Glowing underline */}
                                <motion.span
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                                    className="absolute -bottom-2 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 rounded-full origin-left"
                                    style={{ boxShadow: '0 0 20px rgba(0,229,153,0.4)' }}
                                />
                            </span>
                        </motion.h1>

                        <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
                            className="text-lg text-foreground-muted max-w-lg leading-relaxed"
                        >
                            Real-time threat detection, deep smart contract analysis, and proactive wallet monitoring.
                            Military-grade blockchain security with a cyberpunk soul.
                        </motion.p>

                        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
                            className="flex flex-wrap items-center gap-4 pt-2"
                        >
                            <Button size="xl" className="group relative overflow-hidden"
                                onClick={() => navigate('/scanner')}>
                                <span className="relative z-10 flex items-center">
                                    Launch Scanner
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                            <Button variant="secondary" size="xl"
                                onClick={() => navigate('/dashboard')}>
                                View Dashboard
                            </Button>
                        </motion.div>

                        {/* Trust signals */}
                        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
                            className="flex items-center gap-6 pt-4">
                            <div className="flex items-center gap-2 text-xs text-foreground-muted">
                                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                <span>No private keys needed</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-foreground-muted">
                                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                <span>Free to scan</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-foreground-muted">
                                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                <span>6 chains supported</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right — HUD Card */}
                    <motion.div
                        custom={2} variants={fadeUp} initial="hidden" animate="visible"
                        className="lg:col-span-5 relative hidden lg:block"
                    >
                        <div className="absolute inset-0 -m-8 bg-gradient-to-br from-primary/8 to-indigo-500/5 rounded-3xl blur-[60px]" />

                        <Card variant="glass" className="relative border border-white/[0.08] overflow-hidden">
                            {/* Animated border glow */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-[1px] rounded-[inherit] opacity-30"
                                style={{
                                    background: 'conic-gradient(from 0deg, transparent, #00E599, transparent, #6366F1, transparent)',
                                }}
                            />
                            <div className="relative bg-[#0a0a0d] rounded-[inherit] m-[1px]">
                                <div className="p-6 space-y-6">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                <Shield className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-display font-semibold text-sm">System Status</p>
                                                <p className="text-xs text-foreground-muted">Real-time monitoring</p>
                                            </div>
                                        </div>
                                        <span className="flex items-center gap-1.5 text-xs font-mono text-primary">
                                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,229,153,0.5)]" />
                                            ONLINE
                                        </span>
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Threats", value: "0", icon: Eye, safe: true },
                                            { label: "Scanned", value: "1,402", icon: Radio, safe: true },
                                        ].map((m, i) => (
                                            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <m.icon className="w-3.5 h-3.5 text-foreground-subtle" />
                                                    <span className="text-[10px] uppercase tracking-wider text-foreground-muted">{m.label}</span>
                                                </div>
                                                <p className="font-mono font-bold text-2xl text-foreground-DEFAULT">{m.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Live feed simulation */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[10px] uppercase tracking-wider text-foreground-muted">Network Load</span>
                                            <span className="font-mono text-primary">42%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "42%" }}
                                                transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                                                className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                                                style={{ boxShadow: '0 0 10px rgba(0,229,153,0.3)' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Simulated log entries */}
                                    <div className="space-y-1.5 pt-1">
                                        {[
                                            { time: "00:12", msg: "Approval checked — SAFE", color: "text-primary" },
                                            { time: "00:08", msg: "New contract scanned", color: "text-foreground-muted" },
                                            { time: "00:03", msg: "Threat signature updated", color: "text-cyan-400" },
                                        ].map((log, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 1.2 + i * 0.3, duration: 0.4 }}
                                                className="flex items-center gap-2 text-[11px] font-mono"
                                            >
                                                <span className="text-foreground-subtle">{log.time}s</span>
                                                <span className="text-foreground-subtle">→</span>
                                                <span className={log.color}>{log.msg}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] uppercase tracking-[0.2em] text-foreground-subtle">Scroll to explore</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5"
                    >
                        <div className="w-1 h-2 rounded-full bg-primary" />
                    </motion.div>
                </motion.div>
            </section>

            {/* ===== STATS BAR ===== */}
            <section className="border-y border-white/[0.06] bg-[#0a0a0d]/80 backdrop-blur-xl relative z-10">
                <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="text-center space-y-2 group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3 group-hover:border-primary/20 transition-colors">
                                    <Icon className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
                                </div>
                                <p className="font-mono font-bold text-3xl md:text-4xl text-foreground-DEFAULT">
                                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                </p>
                                <p className="text-[10px] uppercase tracking-wider text-foreground-muted">{stat.label}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* ===== SUPPORTED CHAINS ===== */}
            <section className="py-16 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10"
                    >
                        <span className="text-xs text-foreground-subtle uppercase tracking-wider shrink-0">Supported Chains</span>
                        <div className="flex items-center gap-4 flex-wrap justify-center">
                            {supportedChains.map((chain, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-all cursor-default"
                                >
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chain.color, boxShadow: `0 0 8px ${chain.color}40` }} />
                                    <span className="text-xs font-medium text-foreground-muted">{chain.name}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ===== FEATURES ===== */}
            <section className="py-28 relative">
                <GlowOrb color="rgba(99,102,241,0.05)" size="500px" top="20%" right="-10%" />

                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16 space-y-4"
                    >
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-foreground-muted text-xs font-mono uppercase tracking-widest">
                            <Layers className="w-3 h-3" /> Core Features
                        </span>
                        <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Uncompromising Defense</h2>
                        <p className="text-foreground-muted text-lg max-w-2xl mx-auto">
                            Three layers of protection that work together to secure every transaction, approval, and interaction.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={i}
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                >
                                    <Card variant="grid" className="h-full group border-white/[0.06] hover:border-white/[0.12] transition-all duration-500 overflow-hidden relative">
                                        {/* Hover gradient */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                                        <div className="p-8 space-y-5 relative z-10">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.08] bg-white/[0.02] group-hover:border-white/[0.15] transition-all duration-300"
                                                style={{ boxShadow: `0 0 0 0 ${feature.color}00` }}
                                            >
                                                <Icon className="w-6 h-6" style={{ color: feature.color }} />
                                            </div>
                                            <h3 className="font-display font-semibold text-xl">{feature.title}</h3>
                                            <p className="text-sm text-foreground-muted leading-relaxed">{feature.desc}</p>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section className="py-28 relative border-t border-white/[0.04]">
                <GlowOrb color="rgba(0,229,153,0.04)" size="600px" top="10%" left="-15%" />

                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20 space-y-4"
                    >
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-foreground-muted text-xs font-mono uppercase tracking-widest">
                            <Cpu className="w-3 h-3" /> How It Works
                        </span>
                        <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Four Simple Steps</h2>
                        <p className="text-foreground-muted text-lg max-w-2xl mx-auto">
                            From wallet connection to continuous monitoring in under two minutes.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        {/* Connection line */}
                        <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                        {howItWorks.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={i}
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="relative"
                                >
                                    <div className="text-center space-y-5">
                                        {/* Step number circle */}
                                        <div className="relative mx-auto w-16 h-16">
                                            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center relative z-10 hover:border-white/[0.15] transition-all duration-300"
                                                style={{ boxShadow: `0 0 30px ${step.color}10` }}
                                            >
                                                <Icon className="w-7 h-7" style={{ color: step.color }} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: step.color }}>
                                                Step {step.step}
                                            </span>
                                            <h3 className="font-display font-semibold text-lg">{step.title}</h3>
                                            <p className="text-sm text-foreground-muted leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ===== WHAT MAKES US DIFFERENT ===== */}
            <section className="py-28 relative border-t border-white/[0.04]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left — Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-foreground-muted text-xs font-mono uppercase tracking-widest">
                                    <Sparkles className="w-3 h-3" /> Why WalletSecure
                                </span>
                                <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
                                    Security that
                                    <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">never sleeps.</span>
                                </h2>
                                <p className="text-foreground-muted leading-relaxed">
                                    Unlike basic token approval checkers, WalletSecure combines on-chain data analysis with real-time threat intelligence feeds to give you a comprehensive security posture.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { title: "On-chain analysis engine", desc: "Scans every contract, approval, and interaction pattern for 200+ known attack vectors." },
                                    { title: "Real-time threat feeds", desc: "Continuously updated database of known scam contracts, phishing addresses, and rug-pull patterns." },
                                    { title: "One-click remediation", desc: "Don't just detect — fix. Revoke dangerous approvals instantly without writing a single line of code." },
                                    { title: "Premium monitoring", desc: "24/7 wallet surveillance with instant Telegram and email alerts when threats are detected." },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex gap-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] transition-all duration-300 group"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/15 transition-colors">
                                            <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-1">{item.title}</h4>
                                            <p className="text-xs text-foreground-muted leading-relaxed">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Right — Terminal preview */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            <Card variant="grid" className="border-white/[0.06] overflow-hidden">
                                {/* Terminal header */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.01]">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                    </div>
                                    <span className="text-[10px] font-mono text-foreground-subtle ml-2">walletsecure — scan results</span>
                                </div>
                                {/* Terminal body */}
                                <div className="p-6 font-mono text-xs space-y-2 bg-[#08080a]">
                                    {[
                                        { prefix: "$", text: "walletsecure scan 0x742d...f44e", color: "text-foreground-DEFAULT" },
                                        { prefix: "→", text: "Connecting to Ethereum mainnet...", color: "text-foreground-muted" },
                                        { prefix: "→", text: "Fetching token approvals...", color: "text-foreground-muted" },
                                        { prefix: "→", text: "Analyzing 24 contract interactions...", color: "text-foreground-muted" },
                                        { prefix: "✓", text: "3 unlimited approvals detected", color: "text-yellow-400" },
                                        { prefix: "✓", text: "1 known phishing contract found", color: "text-red-400" },
                                        { prefix: "✓", text: "Risk Score: 67/100 — HIGH", color: "text-red-400" },
                                        { prefix: "", text: "", color: "" },
                                        { prefix: "→", text: "Generating revocation payloads...", color: "text-foreground-muted" },
                                        { prefix: "✓", text: "Ready. Run 'revoke' to fix.", color: "text-primary" },
                                    ].map((line, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -5 }}
                                            whileInView={{ opacity: line.text ? 1 : 0, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.15, duration: 0.3 }}
                                            className={`flex gap-2 ${line.color}`}
                                        >
                                            {line.prefix && <span className="text-foreground-subtle">{line.prefix}</span>}
                                            <span>{line.text}</span>
                                        </motion.div>
                                    ))}
                                    {/* Blinking cursor */}
                                    <motion.span
                                        animate={{ opacity: [1, 0] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        className="inline-block w-2 h-4 bg-primary mt-1"
                                    />
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== FAQ ===== */}
            <section className="py-28 relative border-t border-white/[0.04]">
                <div className="max-w-3xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16 space-y-4"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Common Questions</h2>
                        <p className="text-foreground-muted text-lg">
                            Everything you need to know about WalletSecure.
                        </p>
                    </motion.div>

                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                            >
                                <FAQItem question={faq.q} answer={faq.a} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FINAL CTA ===== */}
            <section className="py-32 relative overflow-hidden">
                <GlowOrb color="rgba(0,229,153,0.06)" size="600px" top="-30%" left="20%" />
                <GlowOrb color="rgba(99,102,241,0.05)" size="400px" bottom="-20%" right="10%" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center space-y-8"
                    >
                        <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight">
                            Ready to
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400"> fortify</span>?
                        </h2>
                        <p className="text-foreground-muted text-lg max-w-xl mx-auto">
                            Connect your wallet and run your first security audit in under 30 seconds. No sign-up required.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button size="xl" className="group"
                                onClick={() => navigate('/scanner')}>
                                Start Your Free Scan
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button variant="secondary" size="xl"
                                onClick={() => navigate('/dashboard')}>
                                Explore Dashboard
                            </Button>
                        </div>
                        <p className="text-xs text-foreground-subtle pt-4">
                            No credit card • No private keys • Works with 6 chains
                        </p>
                    </motion.div>
                </div>
            </section>
        </motion.div>
    );
}

/* ── Expandable FAQ Item ── */
function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`border rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${isOpen ? 'border-primary/20 bg-primary/[0.02]' : 'border-white/[0.06] bg-white/[0.01] hover:border-white/[0.1]'
                }`}
            onClick={() => setIsOpen(!isOpen)}
        >
            <div className="flex items-center justify-between p-5">
                <h4 className="text-sm font-semibold pr-4">{question}</h4>
                <ChevronRight className={`w-4 h-4 text-foreground-muted shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </div>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <p className="px-5 pb-5 text-sm text-foreground-muted leading-relaxed">{answer}</p>
            </motion.div>
        </div>
    );
}
