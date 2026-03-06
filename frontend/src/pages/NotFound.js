import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6"
        >
            <div className="w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6">
                <ShieldOff className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="font-display font-bold text-display-sm mb-3">404</h1>
            <p className="font-mono text-foreground-muted text-sm mb-2">
                ROUTE_NOT_FOUND
            </p>
            <p className="text-foreground-muted max-w-md mb-8">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/">
                <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Button>
            </Link>
        </motion.div>
    );
}
