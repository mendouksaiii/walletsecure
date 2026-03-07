import axios from 'axios';

const API_URL = 'https://walletsecure-api.onrender.com';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('walletsecure_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const authService = {
    login: async (walletAddress) => {
        const response = await api.post('/api/auth/wallet-login', { wallet_address: walletAddress });
        return response.data;
    }
};

export const scanService = {
    scanWallet: async (walletAddress, chain) => {
        // Backend expects `chains` (array) with ChainType enum values like 'eth-mainnet'
        const chainMap = {
            'ethereum': 'eth-mainnet',
            'polygon': 'polygon-mainnet',
            'arbitrum': 'arb-mainnet',
            'optimism': 'opt-mainnet',
            'base': 'base-mainnet',
            'bsc': 'bnb-mainnet',
        };
        const chainValue = chainMap[chain] || chain;
        const response = await api.post('/api/scan/wallet', { wallet_address: walletAddress, chains: [chainValue] });
        return response.data;
    },
    getHistory: async (walletAddress) => {
        const response = await api.get(`/api/scan/history/${walletAddress}`);
        return response.data;
    },
    revokeApproval: async (walletAddress, tokenAddress, spenderAddress, chain) => {
        const chainMap = {
            'ethereum': 'eth-mainnet',
            'polygon': 'polygon-mainnet',
            'arbitrum': 'arb-mainnet',
            'optimism': 'opt-mainnet',
            'base': 'base-mainnet',
            'bsc': 'bnb-mainnet',
        };
        const chainValue = chainMap[chain] || chain;
        const response = await api.post('/api/scan/revoke', {
            wallet_address: walletAddress,
            token_address: tokenAddress,
            spender_address: spenderAddress,
            chain: chainValue
        });
        return response.data; // expects { to, data, value }
    }
};

export const dashboardService = {
    getWalletInfo: async (walletAddress) => {
        const response = await api.get(`/api/wallet/info/${walletAddress}`);
        return response.data;
    },
};

export default api;
