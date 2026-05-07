/* Illustrated book logo — closed on login, open when connected */

export function BookLogo({ state = "open", size = 32, color }) {
    const c = color || "currentColor";
    const sw = size <= 24 ? 1.6 : 1.4;

    if (state === "closed") {
        return (
            <svg
                className="book-logo"
                width={size} height={size}
                viewBox="0 0 48 48"
                fill="none"
                stroke={c}
                strokeWidth={sw}
                strokeLinejoin="round"
                strokeLinecap="round"
            >
                {/* ombre sous le livre */}
                <ellipse cx="25" cy="42.5" rx="14" ry="1.2" fill={c} opacity="0.18" stroke="none"/>
                {/* bloc de pages (perspective) */}
                <path d="M16 9 L37 7 L37 41 L16 43 Z" fill={c} opacity="0.06"/>
                {/* tranches de pages */}
                <line x1="36" y1="11" x2="36" y2="39" strokeWidth={sw * 0.4} opacity="0.5"/>
                <line x1="35" y1="11.5" x2="35" y2="38.5" strokeWidth={sw * 0.3} opacity="0.35"/>
                {/* plat de couverture */}
                <path d="M14 8 L36 6 L36 40 L14 42 Z"/>
                {/* dos */}
                <path d="M14 8 L11 11 L11 45 L14 42 Z"/>
                {/* coiffe du dos */}
                <line x1="11" y1="11" x2="14" y2="8" strokeWidth={sw * 0.7}/>
                {/* nerfs dorés */}
                <line x1="11.5" y1="18" x2="13.5" y2="15" strokeWidth={sw * 0.7} opacity="0.7"/>
                <line x1="11.5" y1="35" x2="13.5" y2="32" strokeWidth={sw * 0.7} opacity="0.7"/>
                {/* filets de titre */}
                <line x1="20" y1="16" x2="32" y2="14.8" strokeWidth={sw * 0.5} opacity="0.6"/>
                <line x1="20" y1="19" x2="29" y2="18.1" strokeWidth={sw * 0.5} opacity="0.6"/>
                {/* monogramme I */}
                <line x1="25" y1="26" x2="25" y2="33" strokeWidth={sw * 1.1}/>
                <line x1="22.5" y1="26" x2="27.5" y2="25.5" strokeWidth={sw * 0.6}/>
                <line x1="22.5" y1="33.3" x2="27.5" y2="32.7" strokeWidth={sw * 0.6}/>
            </svg>
        );
    }

    /* livre ouvert (état connecté) */
    return (
        <svg
            className="book-logo"
            width={size} height={size}
            viewBox="0 0 48 48"
            fill="none"
            stroke={c}
            strokeWidth={sw}
            strokeLinejoin="round"
            strokeLinecap="round"
        >
            <path d="M4 10c6-2 12-2 18 2 0 0 0 0 2 2 2-2 2-2 2-2 6-4 12-4 18-2v28c-6-2-12-2-18 2-2-2-2-2-2-2-6-4-12-4-18-2z"/>
            <path d="M24 14v28" strokeWidth={sw}/>
            <path d="M9 16l10 1.5M9 21l10 1.5M9 26l10 1.5" strokeWidth={sw * 0.6}/>
            <path d="M39 16l-10 1.5M39 21l-10 1.5M39 26l-10 1.5" strokeWidth={sw * 0.6}/>
        </svg>
    );
}
