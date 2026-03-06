import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

export default function Web3ConnectButton() {
    const [address, setAddress] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // On mount, restore address from localStorage if token exists
    useEffect(() => {
        const token = localStorage.getItem('walletsecure_token');
        const savedAddress = localStorage.getItem('walletsecure_address');
        if (token && savedAddress) {
            setAddress(savedAddress);
        }
    }, []);

    const handleConnect = async () => {
        if (!window.ethereum) {
            toast.error('No wallet detected. Please install MetaMask.');
            return;
        }
        setIsLoggingIn(true);
        try {
            // 1. Request accounts
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const currentAddress = accounts[0].toLowerCase();

            // 2. Request server-side nonce
            const nonceResp = await fetch(`${BACKEND_URL}/api/auth/nonce/${currentAddress}`);
            if (!nonceResp.ok) throw new Error('Failed to get nonce');
            const { message: loginMessage } = await nonceResp.json();

            // 3. Sign the message with the wallet
            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [loginMessage, currentAddress],
            });

            // 4. Send signature to backend
            const response = await fetch(`${BACKEND_URL}/api/auth/wallet-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: currentAddress,
                    signature,
                    message: loginMessage,
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || 'Login failed');
            }

            const data = await response.json();
            localStorage.setItem('walletsecure_token', data.access_token);
            localStorage.setItem('walletsecure_address', currentAddress);
            setAddress(currentAddress);
            toast.success('Successfully authenticated!');
        } catch (error) {
            console.error('Login Error:', error);
            toast.error(error.message || 'Failed to authenticate wallet.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleDisconnect = () => {
        localStorage.removeItem('walletsecure_token');
        localStorage.removeItem('walletsecure_address');
        setAddress(null);
        toast.info('Wallet disconnected');
    };

    if (address) {
        return (
            <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-xs text-foreground-muted">Connected</span>
                    <span className="text-sm font-mono text-primary font-bold">
                        {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                >
                    Disconnect
                </Button>
            </div>
        );
    }

    return (
        <Button
            onClick={handleConnect}
            disabled={isLoggingIn}
            className="bg-primary text-black hover:bg-primary-hover shadow-glow-primary font-bold"
        >
            {isLoggingIn ? 'Signing in...' : 'Connect Wallet'}
        </Button>
    );
}
