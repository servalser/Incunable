/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './resources/js/**/*.{js,jsx}',
        './resources/views/**/*.blade.php',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                /* <alpha-value> permet bg-primary/50, text-muted/70, etc. */
                border:     'hsl(var(--border) / <alpha-value>)',
                input:      'hsl(var(--input) / <alpha-value>)',
                ring:       'hsl(var(--ring) / <alpha-value>)',
                background: 'hsl(var(--background) / <alpha-value>)',
                foreground: 'hsl(var(--foreground) / <alpha-value>)',
                primary: {
                    DEFAULT:    'hsl(var(--primary) / <alpha-value>)',
                    foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
                },
                secondary: {
                    DEFAULT:    'hsl(var(--secondary) / <alpha-value>)',
                    foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
                },
                destructive: {
                    DEFAULT:    'hsl(var(--destructive) / <alpha-value>)',
                    foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
                },
                muted: {
                    DEFAULT:    'hsl(var(--muted) / <alpha-value>)',
                    foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
                },
                accent: {
                    DEFAULT:    'hsl(var(--accent) / <alpha-value>)',
                    foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
                },
                popover: {
                    DEFAULT:    'hsl(var(--popover) / <alpha-value>)',
                    foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
                },
                card: {
                    DEFAULT:    'hsl(var(--card) / <alpha-value>)',
                    foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
                },
                success: {
                    DEFAULT:    'hsl(var(--success) / <alpha-value>)',
                    foreground: 'hsl(var(--success-foreground) / <alpha-value>)',
                },
                warning: {
                    DEFAULT:    'hsl(var(--warning) / <alpha-value>)',
                    foreground: 'hsl(var(--warning-foreground) / <alpha-value>)',
                },
                info: {
                    DEFAULT:    'hsl(var(--info) / <alpha-value>)',
                    foreground: 'hsl(var(--info-foreground) / <alpha-value>)',
                },
                sidebar: {
                    background:           'hsl(var(--sidebar-background) / <alpha-value>)',
                    foreground:           'hsl(var(--sidebar-foreground) / <alpha-value>)',
                    primary:              'hsl(var(--sidebar-primary) / <alpha-value>)',
                    muted:                'hsl(var(--sidebar-muted) / <alpha-value>)',
                    border:               'hsl(var(--sidebar-border) / <alpha-value>)',
                    accent:               'hsl(var(--sidebar-accent) / <alpha-value>)',
                    'accent-foreground':  'hsl(var(--sidebar-accent-foreground) / <alpha-value>)',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            fontFamily: {
                sans: ['Geist', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
    /* Classes générées dynamiquement (avatars Distributeurs, animate-bounce) */
    safelist: [
        'animate-bounce',
        'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
        'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
        'bg-indigo-500', 'bg-teal-500', 'bg-pink-500',
    ],
};
