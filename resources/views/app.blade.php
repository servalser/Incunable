<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    {{-- Inertia injecte le titre de la page courante --}}
    <title inertia>Incunable</title>

    {{-- Polices Google (mêmes que le design system original) --}}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Geist:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

    {{-- Chart.js depuis CDN (utilisé dans Dashboard.jsx via window.Chart) --}}
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js" defer></script>

    {{-- Vite compile app.css + app.jsx --}}
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    {{-- Inertia injecte les données de la page (props) dans le HTML --}}
    @inertiaHead
</head>
<body class="{{ auth()->user()?->theme_dark ? 'dark' : '' }}">
    {{-- Point de montage React — Inertia remplace ce div par le composant de la page --}}
    @inertia
</body>
</html>
