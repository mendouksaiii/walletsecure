/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            colors: {
                background: {
                    DEFAULT: "#08080A",
                    surface: "#111114",
                    elevated: "#18181B",
                },
                foreground: {
                    DEFAULT: "#F4F4F5",
                    muted: "#71717A",
                    subtle: "#3F3F46",
                },
                primary: {
                    DEFAULT: "#00E599",
                    foreground: "#022c1e",
                    hover: "#00D4AA",
                    glow: "rgba(0, 229, 153, 0.15)",
                    muted: "rgba(0, 229, 153, 0.08)",
                },
                accent: {
                    DEFAULT: "#6366F1",
                    foreground: "#FFFFFF",
                    glow: "rgba(99, 102, 241, 0.15)",
                },
                destructive: {
                    DEFAULT: "#EF4444",
                    foreground: "#FFFFFF",
                    glow: "rgba(239, 68, 68, 0.15)",
                    muted: "rgba(239, 68, 68, 0.08)",
                },
                warning: {
                    DEFAULT: "#F59E0B",
                    foreground: "#000000",
                    glow: "rgba(245, 158, 11, 0.15)",
                },
                border: {
                    DEFAULT: "rgba(255,255,255,0.06)",
                    hover: "rgba(255,255,255,0.12)",
                    active: "rgba(255,255,255,0.18)",
                },
                muted: {
                    DEFAULT: "#27272A",
                    foreground: "#A1A1AA",
                },
            },
            fontFamily: {
                display: ['"Clash Display"', 'sans-serif'],
                body: ['"Satoshi"', 'sans-serif'],
                mono: ['"IBM Plex Mono"', 'monospace'],
            },
            fontSize: {
                'display-xl': ['4.5rem', { lineHeight: '0.95', letterSpacing: '-0.03em', fontWeight: '700' }],
                'display-lg': ['3.5rem', { lineHeight: '0.95', letterSpacing: '-0.025em', fontWeight: '700' }],
                'display-md': ['2.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '600' }],
                'display-sm': ['1.75rem', { lineHeight: '1.1', letterSpacing: '-0.015em', fontWeight: '600' }],
            },
            boxShadow: {
                'glow-primary': '0 0 20px rgba(0, 229, 153, 0.25), 0 0 60px rgba(0, 229, 153, 0.1)',
                'glow-accent': '0 0 20px rgba(99, 102, 241, 0.25), 0 0 60px rgba(99, 102, 241, 0.1)',
                'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3), 0 0 60px rgba(239, 68, 68, 0.1)',
                'card': '0 0 0 1px rgba(255,255,255,0.04), 0 8px 40px -8px rgba(0,0,0,0.6)',
                'card-hover': '0 0 0 1px rgba(255,255,255,0.08), 0 16px 60px -12px rgba(0,0,0,0.7)',
            },
            borderRadius: {
                'xl': '0.875rem',
                '2xl': '1.25rem',
            },
            keyframes: {
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(24px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'scan-line': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '1' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                'counter': {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'border-flow': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
            },
            animation: {
                'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
                'fade-in': 'fade-in 0.4s ease-out forwards',
                'scan-line': 'scan-line 1.5s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'counter': 'counter 0.3s ease-out forwards',
                'border-flow': 'border-flow 3s ease infinite',
            },
        },
    },
    plugins: [],
}
