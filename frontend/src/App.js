import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";
import NotFound from "./pages/NotFound";
import ParticleBackground from './components/ParticleBackground';
import { Toaster } from "sonner";
import Web3ConnectButton from "./components/Web3ConnectButton";

function NavLink({ href, onClick, children }) {
    const location = useLocation();
    const isActive = location.pathname === href;
    return (
        <a
            href={href}
            onClick={onClick}
            className={`relative text-sm font-medium transition-colors duration-200 ${isActive
                ? "text-foreground-DEFAULT"
                : "text-foreground-muted hover:text-foreground-DEFAULT"
                }`}
        >
            {children}
            {isActive && (
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-brand-primary rounded-full shadow-glow-primary" />
            )}
        </a>
    );
}

function AppContent() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="relative min-h-screen bg-background font-sans selection:bg-brand-primary/30 flex flex-col overflow-x-hidden text-foreground-DEFAULT">

            {/* Global Animated Background */}
            <ParticleBackground />

            {/* Navigation */}
            <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center space-x-12">
                        {/* Logo */}
                        <a href="/" className="flex items-center space-x-3 group">
                            <img src="/logo.png" alt="WalletSecure" className="w-10 h-10 rounded-xl" />
                            <span className="font-bold text-xl tracking-tight text-foreground-DEFAULT hidden sm:block">WalletSecure</span>
                        </a>

                        {/* Desktop Links */}
                        <div className="hidden md:flex items-center space-x-8">
                            <NavLink href="/">Home</NavLink>
                            <NavLink href="/dashboard">Dashboard</NavLink>
                            <NavLink href="/scanner">Scanner</NavLink>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Connect Button */}
                        <div className="hidden sm:block">
                            <Web3ConnectButton />
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-foreground-muted hover:text-foreground-DEFAULT"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="md:hidden absolute top-20 left-0 w-full bg-surface border-b border-border p-4 flex flex-col space-y-4 shadow-xl z-50"
                        >
                            <NavLink href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg py-2">Home</NavLink>
                            <NavLink href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-lg py-2">Dashboard</NavLink>
                            <NavLink href="/scanner" onClick={() => setIsMobileMenuOpen(false)} className="text-lg py-2">Scanner</NavLink>
                            <div className="pt-4 border-t border-border flex justify-center w-full">
                                <Web3ConnectButton />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 relative z-10 w-full">
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<Landing />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/scanner" element={<Scanner />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-8 relative z-10">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <p className="text-xs text-foreground-subtle font-mono">© 2026 WalletSecure</p>
                    <p className="text-xs text-foreground-subtle font-mono">SIGNAL//NOIR v1.0</p>
                </div>
            </footer>

            <Toaster
                theme="dark"
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: '#111114',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: '#F4F4F5',
                        fontFamily: '"Satoshi", sans-serif',
                    },
                }}
            />
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
