/**
 * AcademyLogo Component
 * Vector crest for ACADÉMIE THE BEST
 * With gold border, navy inner disc, star, open book, laurel wreaths, and ribbon.
 */
import React from 'react';

interface AcademyLogoProps {
  className?: string;
  size?: number;
}

export const AcademyLogo: React.FC<AcademyLogoProps> = ({ className = '', size = 48 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    >
      <defs>
        <radialGradient id="crestGoldGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <linearGradient id="crestNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a1931" />
          <stop offset="100%" stopColor="#162a56" />
        </linearGradient>
        <path id="topTextArcLogo" d="M 32,100 A 68,68 0 0,1 168,100" fill="none" />
      </defs>

      {/* Outer gold ring */}
      <circle cx="100" cy="100" r="95" fill="none" stroke="url(#crestGoldGrad)" strokeWidth="5" />
      <circle cx="100" cy="100" r="88" fill="url(#crestNavyGrad)" stroke="#d97706" strokeWidth="2" />

      {/* Inner thin gold dashed circle */}
      <circle
        cx="100"
        cy="100"
        r="68"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeDasharray="3,2"
      />

      {/* Curved Text: ACADÉMIE THE BEST */}
      <text
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="11"
        fontWeight="900"
        fill="#fef08a"
        letterSpacing="1.5"
      >
        <textPath href="#topTextArcLogo" startOffset="50%" textAnchor="middle">
          ACADÉMIE THE BEST
        </textPath>
      </text>

      {/* Laurel Wreath Left */}
      <g fill="#f59e0b" opacity="0.95">
        <path d="M 46,110 C 44,95 50,80 60,68 C 58,74 58,82 62,88 C 54,94 50,102 46,110 Z" />
        <circle cx="56" cy="80" r="2.5" />
        <circle cx="51" cy="94" r="2.5" />
        <circle cx="58" cy="106" r="2.5" />
      </g>

      {/* Laurel Wreath Right */}
      <g fill="#f59e0b" opacity="0.95">
        <path d="M 154,110 C 156,95 150,80 140,68 C 142,74 142,82 138,88 C 146,94 150,102 154,110 Z" />
        <circle cx="144" cy="80" r="2.5" />
        <circle cx="149" cy="94" r="2.5" />
        <circle cx="142" cy="106" r="2.5" />
      </g>

      {/* Star at Top Center */}
      <polygon
        points="100,56 103,64 111,64 105,69 107,77 100,72 93,77 95,69 89,64 97,64"
        fill="url(#crestGoldGrad)"
      />

      {/* Open Book Symbol */}
      <g transform="translate(72, 78) scale(0.56)">
        <path
          d="M 50,30 C 35,22 15,22 5,26 L 5,72 C 15,68 35,68 50,76 C 65,68 85,68 95,72 L 95,26 C 85,22 65,22 50,30 Z"
          fill="#ffffff"
          stroke="#f59e0b"
          strokeWidth="3"
        />
        <line x1="14" y1="36" x2="42" y2="40" stroke="#f59e0b" strokeWidth="2" />
        <line x1="14" y1="46" x2="42" y2="50" stroke="#f59e0b" strokeWidth="2" />
        <line x1="14" y1="56" x2="42" y2="60" stroke="#f59e0b" strokeWidth="2" />
        <line x1="58" y1="40" x2="86" y2="36" stroke="#f59e0b" strokeWidth="2" />
        <line x1="58" y1="50" x2="86" y2="46" stroke="#f59e0b" strokeWidth="2" />
        <line x1="58" y1="60" x2="86" y2="56" stroke="#f59e0b" strokeWidth="2" />
        <line x1="50" y1="30" x2="50" y2="76" stroke="#d97706" strokeWidth="3" />
      </g>

      {/* Bottom Gold Ribbon Banner */}
      <g transform="translate(100, 150)">
        <path
          d="M -54,-10 L 54,-10 L 46,10 L -46,10 Z"
          fill="url(#crestGoldGrad)"
          stroke="#b45309"
          strokeWidth="1.5"
        />
        <path d="M -54,-10 L -66,-2 L -50,6 L -54,-10 Z" fill="#b45309" />
        <path d="M 54,-10 L 66,-2 L 50,6 L 54,-10 Z" fill="#b45309" />
        <text
          x="0"
          y="4"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="11"
          fontWeight="900"
          fill="#0a1931"
          textAnchor="middle"
          letterSpacing="2"
        >
          2021
        </text>
      </g>
    </svg>
  );
};
