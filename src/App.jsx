import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Tesseract from 'tesseract.js'
import './index.css'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'

// ===== Supabase =====
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ===== Voice Commands =====
const VOICE_COMMANDS = {
  comma: ',',
  'full stop': '.',
  period: '.',
  'question mark': '?',
  'exclamation mark': '!',
  'new line': '\n',
  'new paragraph': '\n\n'
}

// ===== Languages =====
const ALL_LANGUAGES = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'ny', name: 'Chichewa' },
  { code: 'zh-CN', name: 'Chinese Simplified' },
  { code: 'zh-TW', name: 'Chinese Traditional' },
  { code: 'co', name: 'Corsican' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'tl', name: 'Filipino' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'fy', name: 'Frisian' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'haw', name: 'Hawaiian' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hmn', name: 'Hmong' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'jw', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'my', name: 'Myanmar' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'or', name: 'Odia' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sm', name: 'Samoan' },
  { code: 'gd', name: 'Scots Gaelic' },
  { code: 'sr', name: 'Serbian' },
  { code: 'st', name: 'Sesotho' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ug', name: 'Uyghur' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' }
]

// ============================================================
//  SVG ICONS
// ============================================================

const IconMoon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const IconSun = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const IconSearch = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconPlus = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconX = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconChevronDown = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const IconChevronUp = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const IconChevronRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const IconCheck = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconMenuDots = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
)

const IconLogout = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const IconBack = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconTranslate = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const IconSave = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
)

const IconMic = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const IconMicOff = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 10v2a5 5 0 0 1-4.46 4.96" />
    <path d="M12 19v4" />
    <path d="M8 23h8" />
    <path d="M12 12a3 3 0 0 1-3-3" />
  </svg>
)

const IconImage = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const IconCopy = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const IconTrash = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconShare = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const IconPlay = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const IconPause = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

const IconReset = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

const IconSparkle = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
  </svg>
)

const IconTrophy = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
)

const IconTarget = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const IconClock = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconTrendingUp = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

const IconCalendar = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconAlertTriangle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

// ============================================================
//  LOGO SVG
// ============================================================

const LogoIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22E2FF"/>
        <stop offset="48%" stopColor="#4A8EFF"/>
        <stop offset="100%" stopColor="#B43DFF"/>
      </linearGradient>
      <linearGradient id="innerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="7"/>
      </filter>
      <filter id="shadow">
        <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#4A8EFF" floodOpacity="0.3"/>
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#B43DFF" floodOpacity="0.2"/>
      </filter>
      <mask id="cutouts">
        <rect width="512" height="512" fill="white"/>
        <path fill="black" d="M70 162 H198 Q212 162 212 174 Q212 186 198 186 H70 Q54 186 54 174 Q54 162 70 162 Z"/>
        <path fill="black" d="M60 228 H222 Q238 228 238 242 Q238 256 222 256 H60 Q44 256 44 242 Q44 228 60 228 Z"/>
        <path fill="black" d="M72 296 H184 L212 330 H70 Q54 330 54 314 Q54 296 72 296 Z"/>
      </mask>
      <g id="sparkle">
        <path d="M0-24 C0-8 8 0 24 0 C8 0 0 8 0 24 C0 8 -8 0 -24 0 C-8 0 0-8 0-24Z" fill="#ffffff"/>
      </g>
    </defs>
    <g filter="url(#glow) url(#shadow)">
      <g mask="url(#cutouts)">
        <path fill="url(#logoGrad)" d="M176 74 H288 C408 74 472 150 472 256 C472 362 408 438 288 438 H176 Q146 438 146 406 V106 Q146 74 176 74 Z"/>
        <path fill="url(#innerGlow)" d="M176 74 H288 C408 74 472 150 472 256 C472 362 408 438 288 438 H176 Q146 438 146 406 V106 Q146 74 176 74 Z"/>
      </g>
      <path fill="#0F1115" d="M236 122 Q214 122 214 144 V368 Q214 390 236 390 H282 C365 390 414 338 414 256 C414 174 365 122 282 122 Z"/>
      <path fill="none" stroke="#000" strokeOpacity="0.3" strokeWidth="4" d="M236 122 Q214 122 214 144 V368 Q214 390 236 390 H282 C365 390 414 338 414 256 C414 174 365 122 282 122 Z"/>
      <path fill="none" stroke="#ffffff" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" d="M242 262 L274 296 L338 214"/>
      <path fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="50" strokeLinecap="round" strokeLinejoin="round" d="M242 262 L274 296 L338 214"/>
    </g>
    <use href="#sparkle" x="80" y="80" transform="scale(0.8)" opacity="0.9">
      <animateTransform attributeName="transform" type="translate" values="0,0; -6,-6; 0,0" dur="4s" repeatCount="indefinite"/>
    </use>
    <use href="#sparkle" x="410" y="120" transform="scale(0.6)" opacity="0.7">
      <animateTransform attributeName="transform" type="translate" values="0,0; 4,-8; 0,0" dur="5s" repeatCount="indefinite"/>
    </use>
    <use href="#sparkle" x="430" y="380" transform="scale(0.7)" opacity="0.8">
      <animateTransform attributeName="transform" type="translate" values="0,0; -8,4; 0,0" dur="4.5s" repeatCount="indefinite"/>
    </use>
    <use href="#sparkle" x="90" y="420" transform="scale(0.5)" opacity="0.6">
      <animateTransform attributeName="transform" type="translate" values="0,0; 6,4; 0,0" dur="3.5s" repeatCount="indefinite"/>
    </use>
  </svg>
)

// ============================================================
//  HELPERS
// ============================================================

const detectCodeLanguage = (text) => {
  const patterns = [
    { regex: /import\s+.*from\s+['"].*['"]|export\s+(default\s+)?|const\s+.*=\s*\(/, name: 'JavaScript/React' },
    { regex: /def\s+\w+\s*\(.*\):|import\s+\w+|from\s+\w+\s+import/, name: 'Python' },
    { regex: /public\s+class\s+\w+|System\.out\.println|import\s+java\./, name: 'Java' },
    { regex: /#include\s*<.*>|std::|int\s+main\s*\(/, name: 'C++' },
    { regex: /<\?php|\$\w+\s*=|echo\s+/, name: 'PHP' },
    { regex: /SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+.*SET/i, name: 'SQL' },
    { regex: /<html|<div|<body|<head|<!DOCTYPE/, name: 'HTML' },
    { regex: /\{\s*"[\w]+"\s*:|JSON\.parse|JSON\.stringify/, name: 'JSON' },
    { regex: /^\s*[\w-]+\s*:\s*.+$/m, name: 'YAML' }
  ]
  for (const { regex, name } of patterns) {
    if (regex.test(text)) return name
  }
  return null
}

const getNLLBLangCode = (code) => {
  const map = {
    en: 'eng_Latn', es: 'spa_Latn', fr: 'fra_Latn', de: 'deu_Latn',
    it: 'ita_Latn', pt: 'por_Latn', ru: 'rus_Cyrl', 'zh-CN': 'zho_Hans',
    'zh-TW': 'zho_Hant', ja: 'jpn_Jpan', ko: 'kor_Hang', ar: 'arb_Arab',
    hi: 'hin_Deva', nl: 'nld_Latn', pl: 'pol_Latn', tr: 'tur_Latn',
    vi: 'vie_Latn', th: 'tha_Thai', he: 'heb_Hebr', sv: 'swe_Latn',
    da: 'dan_Latn', fi: 'fin_Latn', no: 'nob_Latn', cs: 'ces_Latn',
    el: 'ell_Grek', hu: 'hun_Latn', ro: 'ron_Latn', uk: 'ukr_Cyrl',
    id: 'ind_Latn', ms: 'zsm_Latn', fa: 'pes_Arab', bn: 'ben_Beng',
    ta: 'tam_Taml', te: 'tel_Telu', mr: 'mar_Deva', ur: 'urd_Arab',
    sw: 'swh_Latn', fil: 'tgl_Latn', tl: 'tgl_Latn'
  }
  return map[code] || 'eng_Latn'
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// ============================================================
//  APP COMPONENT
// ============================================================

export default function App() {
  // ===== State =====
  // Auth
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // UI
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState('notes')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [expandedEntries, setExpandedEntries] = useState({})

  // Menu
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  // Stats Modal
  const [showStatsModal, setShowStatsModal] = useState(false)

  // Notes
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [noteText, setNoteText] = useState('')
  const [category, setCategory] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [viewMode, setViewMode] = useState('home')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [detectedCode, setDetectedCode] = useState(null)
  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState('16')
  const [titleFont, setTitleFont] = useState('Inter')
  const [showNotesDropdown, setShowNotesDropdown] = useState(false)
  const [activeNoteCategory, setActiveNoteCategory] = useState('All')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [selectedNotes, setSelectedNotes] = useState([])
  const [selectionMode, setSelectionMode] = useState(false)

  // Tasks
  const [tasks, setTasks] = useState([])
  const [task, setTask] = useState('')
  const [taskCategory, setTaskCategory] = useState('daily')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskTime, setTaskTime] = useState('')
  const [taskWeekDay, setTaskWeekDay] = useState('monday')
  const [taskDifficulty, setTaskDifficulty] = useState('medium')
  const [taskMinutes, setTaskMinutes] = useState(30)
  const [taskTag, setTaskTag] = useState('general')
  const [editingTask, setEditingTask] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [subTasks, setSubTasks] = useState({})
  const [newSubTask, setNewSubTask] = useState('')
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [subTasksToAdd, setSubTasksToAdd] = useState([])
  const [taskSaving, setTaskSaving] = useState(false)

  // Journal
  const [journalEntries, setJournalEntries] = useState([])
  const [journalEntry, setJournalEntry] = useState('')
  const [journalMood, setJournalMood] = useState('')
  const [journalTags, setJournalTags] = useState('')
  const [journalDateFilter, setJournalDateFilter] = useState('')
  const [journalTagFilter, setJournalTagFilter] = useState('')
  const [journalSaving, setJournalSaving] = useState(false)

  // Pomodoro
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [pomodoroSessions, setPomodoroSessions] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [pomodoroState, setPomodoroState] = useState('idle')
  const [showCelebration, setShowCelebration] = useState(false)
  const [focusDuration, setFocusDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)

  // Stats
  const [statsData, setStatsData] = useState({
    disciplineScore: 0,
    disciplineLevel: 'Novice',
    disciplineBadge: '🌱',
    longestStreak: 0,
    dailyAverage: 0,
    bestDay: null,
    bestDayCount: 0,
    commitmentRate: 0,
    focusScore: 0,
    monthlyProgress: 0,
    habitCompletion: 0,
    taskVelocity: 0,
    weeklyBreakdown: [],
    dailyHabitsDone: 0,
    dailyHabitsTotal: 0,
    weeklyHabitsDone: 0,
    weeklyHabitsTotal: 0,
    monthlyHabitsDone: 0,
    monthlyHabitsTotal: 0,
    todayFocus: 0,
    weekFocus: 0,
    monthFocus: 0,
    bestFocusDay: null,
    bestFocusMinutes: 0,
    avgFocusPerDay: 0,
    streakEndangered: false,
    daysUntilStreakLoss: 0,
    nextMilestone: 0
  })

  // Voice
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)

  // Export
  const [showExport, setShowExport] = useState(false)
  const [targetLang, setTargetLang] = useState('fr')

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success', undo: null })
  const toastTimeout = useRef(null)

  // ============================================================
  //  HELPERS
  // ============================================================

  const formatMinutes = (mins) => {
    if (!mins || mins === 0) return '0m'
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60)
    const secs = Math.floor(sec % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  const formatNoteTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatEntryDate = (date) => {
    const now = new Date()
    const entry = new Date(date)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const entryDay = new Date(entry.getFullYear(), entry.getMonth(), entry.getDate())

    if (entryDay.getTime() === today.getTime()) return 'Today'
    if (entryDay.getTime() === yesterday.getTime()) return 'Yesterday'

    const diffDays = Math.floor((today - entryDay) / (1000 * 60 * 60 * 24))
    if (diffDays <= 7) return 'This Week'
    return 'Earlier'
  }

  const getWordCount = (text) => {
    if (!text) return 0
    return text.trim().split(/\s+/).length
  }

  const getReadingTime = (text) => {
    const words = getWordCount(text)
    if (words < 1) return 0
    return Math.max(1, Math.round(words / 200))
  }

  const getStreak = () => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayHabits = tasks.filter(t => t.type === 'habit' && t.due_date === dateStr)
      if (dayHabits.length === 0) continue
      const allDone = dayHabits.every(t => t.done)
      if (allDone) streak++
      else break
    }
    return streak
  }

  const getFailedDays = () => {
    const failed = []
    const today = new Date()
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayHabits = tasks.filter(t => t.type === 'habit' && t.due_date === dateStr)
      if (dayHabits.length > 0) {
        const completed = dayHabits.filter(t => t.done).length
        if (completed < dayHabits.length) {
          failed.push({ date: dateStr, completed, total: dayHabits.length })
        }
      }
    }
    return failed
  }

  const shouldResetTask = (task) => {
    if (!task.done) return false
    const now = new Date()
    const taskDate = new Date(task.updated_at || task.created_at)
    if (task.type === 'habit') {
      if (task.category === 'daily') {
        return (now - taskDate) / (1000 * 60 * 60) >= 24
      } else if (task.category === 'weekly') {
        return (now - taskDate) / (1000 * 60 * 60 * 24) >= 7
      }
    }
    return false
  }

  const showToast = (message, type = 'success', undo = null) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast({ show: true, message, type, undo })
    toastTimeout.current = setTimeout(() => {
      setToast({ show: false, message: '', type: 'success', undo: null })
    }, 2500)
  }

  // ============================================================
  //  STATS CALCULATIONS
  // ============================================================

  const calculateAllStats = useCallback(() => {
    if (!tasks.length && !journalEntries.length) return

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    const streak = getStreak()
    
    let maxStreak = 0
    let currentStreak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayHabits = tasks.filter(t => t.type === 'habit' && t.due_date === dateStr)
      if (dayHabits.length > 0 && dayHabits.every(t => t.done)) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }
    
    const doneTasks = tasks.filter(t => t.done).length
    const dailyAverage = (doneTasks / 30).toFixed(1)
    
    const dayCounts = {}
    tasks.filter(t => t.done).forEach(t => {
      const day = new Date(t.updated_at || t.due_date).toLocaleDateString()
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })
    let bestDay = null
    let bestDayCount = 0
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > bestDayCount) {
        bestDayCount = count
        bestDay = day
      }
    })
    
    const totalTasks = tasks.length
    const doneTasksCount = tasks.filter(t => t.done).length
    const commitmentRate = totalTasks > 0 ? Math.round((doneTasksCount / totalTasks) * 100) : 0
    
    const focusScore = totalMinutes > 0 ? Math.min(Math.round((totalMinutes / 6000) * 100), 100) : 0
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthTasks = tasks.filter(t => new Date(t.due_date) >= monthStart)
    const monthDone = monthTasks.filter(t => t.done).length
    const monthlyProgress = monthTasks.length > 0 ? Math.round((monthDone / monthTasks.length) * 100) : 0
    
    const habits = tasks.filter(t => t.type === 'habit')
    const habitsDone = habits.filter(t => t.done).length
    const habitCompletion = habits.length > 0 ? Math.round((habitsDone / habits.length) * 100) : 0
    
    const taskVelocity = totalMinutes > 0 ? Number((doneTasksCount / (totalMinutes / 60)).toFixed(1)) : 0
    
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const weeklyBreakdown = weekDays.map((day, index) => {
      const dayNum = index + 1
      const dayTasks = tasks.filter(t => {
        const d = new Date(t.due_date)
        return d.getDay() === (dayNum % 7)
      })
      const done = dayTasks.filter(t => t.done).length
      const total = dayTasks.length
      return {
        day,
        done,
        total,
        percent: total > 0 ? Math.round((done / total) * 100) : 0
      }
    })
    
    const dailyHabits = tasks.filter(t => t.type === 'habit' && t.category === 'daily')
    const dailyHabitsDone = dailyHabits.filter(t => t.done).length
    const dailyHabitsTotal = dailyHabits.length
    
    const weeklyHabits = tasks.filter(t => t.type === 'habit' && t.category === 'weekly')
    const weeklyHabitsDone = weeklyHabits.filter(t => t.done).length
    const weeklyHabitsTotal = weeklyHabits.length
    
    const monthlyHabits = tasks.filter(t => t.type === 'habit' && t.category === 'monthly')
    const monthlyHabitsDone = monthlyHabits.filter(t => t.done).length
    const monthlyHabitsTotal = monthlyHabits.length
    
    const todayFocus = tasks
      .filter(t => t.done && t.estimated_minutes)
      .filter(t => new Date(t.updated_at || t.due_date).toISOString().split('T')[0] === today)
      .reduce((sum, t) => sum + t.estimated_minutes, 0)
    
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    const weekFocus = tasks
      .filter(t => t.done && t.estimated_minutes)
      .filter(t => new Date(t.updated_at || t.due_date) >= weekAgo)
      .reduce((sum, t) => sum + t.estimated_minutes, 0)
    
    const monthAgo = new Date(now)
    monthAgo.setDate(now.getDate() - 30)
    const monthFocus = tasks
      .filter(t => t.done && t.estimated_minutes)
      .filter(t => new Date(t.updated_at || t.due_date) >= monthAgo)
      .reduce((sum, t) => sum + t.estimated_minutes, 0)
    
    const focusDayCounts = {}
    tasks
      .filter(t => t.done && t.estimated_minutes)
      .forEach(t => {
        const day = new Date(t.updated_at || t.due_date).toLocaleDateString()
        focusDayCounts[day] = (focusDayCounts[day] || 0) + t.estimated_minutes
      })
    let bestFocusDay = null
    let bestFocusMinutes = 0
    Object.entries(focusDayCounts).forEach(([day, minutes]) => {
      if (minutes > bestFocusMinutes) {
        bestFocusMinutes = minutes
        bestFocusDay = day
      }
    })
    
    const avgFocusPerDay = 30 > 0 ? Math.round(monthFocus / 30) : 0
    
    const streakWeight = Math.min(streak / 100, 1) * 35
    const completionWeight = commitmentRate / 100 * 35
    const focusWeight = Math.min(totalMinutes / 6000, 1) * 30
    const disciplineScore = Math.round(streakWeight + completionWeight + focusWeight)
    
    let disciplineLevel = 'Novice'
    let disciplineBadge = '🌱'
    if (disciplineScore >= 90) { disciplineLevel = 'Legend'; disciplineBadge = '👑' }
    else if (disciplineScore >= 80) { disciplineLevel = 'Master'; disciplineBadge = '🏆' }
    else if (disciplineScore >= 60) { disciplineLevel = 'Focused'; disciplineBadge = '🎯' }
    else if (disciplineScore >= 40) { disciplineLevel = 'Disciplined'; disciplineBadge = '⚡' }
    else if (disciplineScore >= 20) { disciplineLevel = 'Apprentice'; disciplineBadge = '📚' }
    
    let daysUntilStreakLoss = 0
    let streakEndangered = false
    if (streak > 0) {
      for (let i = 1; i <= 7; i++) {
        const d = new Date(now)
        d.setDate(now.getDate() + i)
        const dateStr = d.toISOString().split('T')[0]
        const dayHabits = tasks.filter(t => t.type === 'habit' && t.due_date === dateStr)
        if (dayHabits.length > 0) {
          const done = dayHabits.filter(t => t.done).length
          if (done < dayHabits.length) {
            daysUntilStreakLoss = i
            streakEndangered = true
            break
          }
        }
      }
    }
    
    const milestones = [10, 25, 50, 75, 100, 150, 200, 365]
    let nextMilestone = 0
    for (const m of milestones) {
      if (m > streak) {
        nextMilestone = m
        break
      }
    }
    
    setStatsData({
      disciplineScore,
      disciplineLevel,
      disciplineBadge,
      longestStreak: maxStreak,
      dailyAverage: parseFloat(dailyAverage),
      bestDay,
      bestDayCount,
      commitmentRate,
      focusScore,
      monthlyProgress,
      habitCompletion,
      taskVelocity,
      weeklyBreakdown,
      dailyHabitsDone,
      dailyHabitsTotal,
      weeklyHabitsDone,
      weeklyHabitsTotal,
      monthlyHabitsDone,
      monthlyHabitsTotal,
      todayFocus,
      weekFocus,
      monthFocus,
      bestFocusDay,
      bestFocusMinutes,
      avgFocusPerDay,
      streakEndangered,
      daysUntilStreakLoss,
      nextMilestone
    })
  }, [tasks, totalMinutes, journalEntries])

  // ============================================================
  //  EXPORT STATS REPORT
  // ============================================================

  const exportStatsReport = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    
    doc.setFontSize(24)
    doc.setTextColor(79, 140, 255)
    doc.text('Discypln Stats Report', 20, 30)
    
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42)
    
    doc.setDrawColor(79, 140, 255)
    doc.line(20, 48, pageWidth - 20, 48)
    
    let y = 60
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('Discipline Overview', 20, y)
    y += 10
    
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.text(`Discipline Score: ${statsData.disciplineScore}/100`, 25, y)
    y += 8
    doc.text(`Level: ${statsData.disciplineBadge} ${statsData.disciplineLevel}`, 25, y)
    y += 8
    doc.text(`Current Streak: ${getStreak()} days`, 25, y)
    y += 8
    doc.text(`Longest Streak: ${statsData.longestStreak} days`, 25, y)
    y += 12
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('Weekly Breakdown', 20, y)
    y += 10
    
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    statsData.weeklyBreakdown.forEach(day => {
      doc.text(`${day.day}: ${day.percent}% (${day.done}/${day.total})`, 25, y)
      y += 7
    })
    y += 6
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('Habit Tracker', 20, y)
    y += 10
    
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    const dailyPct = statsData.dailyHabitsTotal > 0 
      ? Math.round((statsData.dailyHabitsDone / statsData.dailyHabitsTotal) * 100)
      : 0
    const weeklyPct = statsData.weeklyHabitsTotal > 0 
      ? Math.round((statsData.weeklyHabitsDone / statsData.weeklyHabitsTotal) * 100)
      : 0
    const monthlyPct = statsData.monthlyHabitsTotal > 0 
      ? Math.round((statsData.monthlyHabitsDone / statsData.monthlyHabitsTotal) * 100)
      : 0
    
    doc.text(`Daily Habits: ${dailyPct}% (${statsData.dailyHabitsDone}/${statsData.dailyHabitsTotal})`, 25, y)
    y += 8
    doc.text(`Weekly Habits: ${weeklyPct}% (${statsData.weeklyHabitsDone}/${statsData.weeklyHabitsTotal})`, 25, y)
    y += 8
    doc.text(`Monthly Habits: ${monthlyPct}% (${statsData.monthlyHabitsDone}/${statsData.monthlyHabitsTotal})`, 25, y)
    y += 12
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('Focus Analysis', 20, y)
    y += 10
    
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.text(`Today: ${formatMinutes(statsData.todayFocus)}`, 25, y)
    y += 8
    doc.text(`This Week: ${formatMinutes(statsData.weekFocus)}`, 25, y)
    y += 8
    doc.text(`This Month: ${formatMinutes(statsData.monthFocus)}`, 25, y)
    y += 8
    doc.text(`Average Per Day: ${formatMinutes(statsData.avgFocusPerDay)}`, 25, y)
    y += 8
    if (statsData.bestFocusDay) {
      doc.text(`Best Day: ${statsData.bestFocusDay} (${formatMinutes(statsData.bestFocusMinutes)})`, 25, y)
      y += 8
    }
    y += 6
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('Additional Metrics', 20, y)
    y += 10
    
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.text(`Commitment Rate: ${statsData.commitmentRate}%`, 25, y)
    y += 8
    doc.text(`Monthly Progress: ${statsData.monthlyProgress}%`, 25, y)
    y += 8
    doc.text(`Habit Completion: ${statsData.habitCompletion}%`, 25, y)
    y += 8
    doc.text(`Task Velocity: ${statsData.taskVelocity} tasks/hour`, 25, y)
    y += 8
    doc.text(`Daily Average (30d): ${statsData.dailyAverage} tasks`, 25, y)
    y += 8
    if (statsData.bestDay) {
      doc.text(`Best Day: ${statsData.bestDay} (${statsData.bestDayCount} tasks)`, 25, y)
      y += 8
    }
    
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text('Generated by Discypln - Stay Focused. Stay Disciplined.', 20, 280)
    
    doc.save(`Discypln_Stats_Report_${new Date().toISOString().split('T')[0]}.pdf`)
    showToast('Stats report exported!', 'success')
  }

  // ============================================================
  //  EFFECTS
  // ============================================================

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchNotes()
        fetchTasks()
        fetchJournal()
        fetchPomodoroStats()
      }
    })
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchNotes()
        fetchTasks()
        fetchJournal()
        fetchPomodoroStats()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchNotes()
      fetchTasks()
      fetchJournal()
    }
  }, [selectedDate, user])

  useEffect(() => {
    if (noteText) {
      const codeLang = detectCodeLanguage(noteText)
      if (codeLang) {
        setDetectedCode(codeLang)
        setMessage(`Code detected: ${codeLang}`)
        setTimeout(() => setMessage(''), 2000)
      } else {
        setDetectedCode(null)
      }
    }
  }, [noteText])

  useEffect(() => {
    if (!user || tasks.length === 0) return

    const resetTasks = async () => {
      let resetCount = 0
      for (const task of tasks) {
        if (shouldResetTask(task)) {
          const { error } = await supabase
            .from('tasks')
            .update({ done: false, updated_at: new Date().toISOString() })
            .eq('id', task.id)
            .eq('user_id', user.id)
          if (!error) resetCount++
        }
      }
      if (resetCount > 0) {
        showToast(`${resetCount} task${resetCount > 1 ? 's' : ''} reset!`, 'success')
        fetchTasks()
      }
    }

    const interval = setInterval(resetTasks, 30000)
    resetTasks()
    return () => clearInterval(interval)
  }, [user, tasks])

  useEffect(() => {
    if (user) {
      calculateAllStats()
    }
  }, [tasks, totalMinutes, user])

  // ===== Pomodoro Effects =====
  useEffect(() => {
    let interval
    if (pomodoroRunning) {
      setPomodoroState('running')
      interval = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            handlePomodoroComplete()
            return isBreak ? breakDuration * 60 : focusDuration * 60
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setPomodoroState(pomodoroTime === 0 ? 'finished' : 'idle')
    }
    return () => clearInterval(interval)
  }, [pomodoroRunning, isBreak, focusDuration, breakDuration])

  useEffect(() => {
    const saved = localStorage.getItem('pomodoroState')
    if (saved) {
      try {
        const state = JSON.parse(saved)
        setFocusDuration(state.focusDuration ?? 25)
        setBreakDuration(state.breakDuration ?? 5)
        setPomodoroSessions(state.pomodoroSessions ?? 0)
        setTotalMinutes(state.totalMinutes ?? 0)
        setIsBreak(state.isBreak ?? false)
        
        if (state.pomodoroRunning && state.timestamp) {
          const elapsed = (Date.now() - state.timestamp) / 1000
          const remaining = Math.max(0, Math.round(state.pomodoroTime - elapsed))
          setPomodoroTime(remaining)
          if (remaining > 0) {
            setPomodoroRunning(true)
            setPomodoroState('running')
          } else {
            setPomodoroRunning(false)
            setPomodoroState('idle')
            setPomodoroTime(Math.round((state.isBreak ? state.breakDuration : state.focusDuration) * 60))
          }
        } else {
          setPomodoroTime(Math.round((state.isBreak ? state.breakDuration : state.focusDuration) * 60))
          setPomodoroRunning(false)
          setPomodoroState('idle')
        }
      } catch (e) {}
    }
  }, [])

  useEffect(() => {
    const state = {
      pomodoroTime,
      pomodoroRunning,
      isBreak,
      pomodoroSessions,
      totalMinutes,
      focusDuration,
      breakDuration,
      timestamp: Date.now()
    }
    localStorage.setItem('pomodoroState', JSON.stringify(state))
  }, [pomodoroTime, pomodoroRunning, isBreak, pomodoroSessions, totalMinutes, focusDuration, breakDuration])

  // ===== Voice Recognition =====
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMessage('Speech Recognition not supported. Use Chrome/Safari')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    let userStopped = false

    recognition.onstart = () => {
      setIsListening(true)
      setMessage('Listening... Say: comma, full stop, new line')
    }

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim()
        if (event.results[i].isFinal) {
          final += transcript + ' '
        } else {
          interim += transcript + ' '
        }
      }

      const process = (text) => {
        let out = text.toLowerCase()
        Object.keys(VOICE_COMMANDS).forEach(cmd => {
          const regex = new RegExp(`\\b${cmd}\\b`, 'gi')
          out = out.replace(regex, VOICE_COMMANDS[cmd])
        })
        return out
      }

      setNoteText(prev => {
        const base = prev.replace(/\s*\[[^\]]*\]$/, '')
        const processedFinal = process(final)
        const processedInterim = process(interim)
        return base + processedFinal + (processedInterim ? ` [${processedInterim}]` : '')
      })
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setMessage('Microphone denied. Allow mic permission')
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setMessage(`Mic error: ${event.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (!userStopped) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch {}
        }, 200)
      }
    }

    recognitionRef.current = recognition
    return () => {
      userStopped = true
      recognition.stop()
    }
  }, [])

  // ============================================================
  //  AUTH FUNCTIONS
  // ============================================================

  async function signUp() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) setMessage(error.message)
    else setMessage('Check email for confirmation link')
  }

  async function signIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMessage(error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setNotes([])
    setTasks([])
    setJournalEntries([])
    setTitle('')
    setNoteText('')
    setEditingNote(null)
    setViewMode('home')
  }

  // ============================================================
  //  NOTES FUNCTIONS
  // ============================================================

  async function fetchNotes() {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('Fetch error:', error)
      setMessage('Failed to load notes')
    } else {
      setNotes(data || [])
    }
  }

  async function saveNote() {
    if (!title.trim() || !noteText.trim()) {
      setMessage('Title and note required')
      return
    }
    setIsSaving(true)
    setSaveStatus('Saving...')

    const noteData = {
      title: title.trim(),
      content: noteText.trim(),
      font_family: fontFamily,
      title_font: titleFont,
      font_size: parseInt(fontSize),
      category: category.trim() || 'Uncategorized',
      user_id: user.id,
      date: selectedDate
    }

    if (editingNote) {
      const { error } = await supabase
        .from('notes')
        .update(noteData)
        .eq('id', editingNote.id)
        .eq('user_id', user.id)

      if (error) {
        setMessage('Error: ' + error.message)
        setIsSaving(false)
        setSaveStatus('')
      } else {
        setSaveStatus('Saved')
        setTimeout(() => setSaveStatus(''), 1500)
        showToast('Note updated!', 'success')
        setEditingNote(null)
        setTitle('')
        setNoteText('')
        setCategory('')
        await fetchNotes()
        setViewMode('home')
        setIsSaving(false)
      }
    } else {
      const { error } = await supabase.from('notes').insert([noteData])

      if (error) {
        setMessage('Error: ' + error.message)
        setIsSaving(false)
        setSaveStatus('')
      } else {
        setSaveStatus('Saved')
        setTimeout(() => setSaveStatus(''), 1500)
        showToast('Note saved!', 'success')
        setTitle('')
        setNoteText('')
        setCategory('')
        await fetchNotes()
        setViewMode('home')
        setIsSaving(false)
      }
    }
  }

  function openAddNote() {
    setEditingNote(null)
    setTitle('')
    setNoteText('')
    setCategory('')
    setViewMode('add')
    setSaveStatus('')
  }

  function openEditNote(note) {
    setEditingNote(note)
    setTitle(note.title)
    setNoteText(note.content)
    setFontFamily(note.font_family || 'Inter')
    setTitleFont(note.title_font || 'Inter')
    setFontSize(note.font_size?.toString() || '16')
    setCategory(note.category || '')
    setViewMode('edit')
    setSaveStatus('')
  }

  function goBack() {
    setViewMode('home')
    setEditingNote(null)
    setTitle('')
    setNoteText('')
    setCategory('')
    setSaveStatus('')
  }

  async function deleteNote(id) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) {
      setMessage('Delete failed: ' + error.message)
    } else {
      showToast('Note deleted', 'success', () => {})
      await fetchNotes()
      setViewMode('home')
    }
  }

  async function deleteMultipleNotes() {
    const { error } = await supabase
      .from('notes')
      .delete()
      .in('id', selectedNotes)
      .eq('user_id', user.id)

    if (error) {
      setMessage('Delete failed: ' + error.message)
    } else {
      showToast(`${selectedNotes.length} note(s) deleted`, 'success', () => {})
      setSelectedNotes([])
      setSelectionMode(false)
      await fetchNotes()
      setViewMode('home')
    }
  }

  function exportSelectedNotes() {
    const notesToExport = notes.filter((n) => selectedNotes.includes(n.id))
    if (notesToExport.length === 0) {
      setMessage('Select notes to export')
      return
    }
    
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`Discypln Notes - ${selectedDate}`, 20, 20)
    let yPos = 40
    notesToExport.forEach((note, idx) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      doc.setFontSize(14)
      doc.text(`${idx + 1}. ${note.title}`, 20, yPos)
      doc.setFontSize(11)
      const splitText = doc.splitTextToSize(note.content, 170)
      splitText.forEach((line) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.text(line, 20, yPos)
        yPos += 6
      })
      doc.text(`Category: ${note.category || 'Uncategorized'}`, 20, yPos)
      yPos += 12
    })
    doc.save(`discypln-notes-${selectedDate}.pdf`)
    showToast(`${selectedNotes.length} note(s) exported!`, 'success')
    setSelectedNotes([])
    setSelectionMode(false)
  }

  async function shareNote() {
    if (!editingNote) return
    const shareText = `${editingNote.title}\n\n${editingNote.content}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: editingNote.title,
          text: shareText
        })
        showToast('Note shared!', 'success')
      } catch (err) {
        if (err.name !== 'AbortError') {
          setMessage('Sharing failed')
        }
      }
    } else {
      navigator.clipboard.writeText(shareText)
      showToast('Copied to clipboard', 'success')
    }
  }

  // ============================================================
  //  TRANSLATION
  // ============================================================

  async function translateNote() {
    if (!noteText.trim()) {
      setMessage('Note empty. Type something first.')
      return
    }

    setLoading(true)
    setMessage('Translating...')

    const textToTranslate = noteText.trim()
    const langName = ALL_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang

    try {
      const res = await fetch(
        'https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: textToTranslate,
            parameters: {
              src_lang: 'eng_Latn',
              tgt_lang: getNLLBLangCode(targetLang)
            }
          })
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (data[0]?.translation_text) {
          setNoteText(data[0].translation_text)
          showToast(`Translated to ${langName}!`, 'success')
          setLoading(false)
          return
        }
      }
    } catch (e) {
      console.log('HuggingFace failed:', e)
    }

    try {
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: textToTranslate,
          source: 'auto',
          target: targetLang,
          format: 'text'
        })
      })
      if (response.ok) {
        const data = await response.json()
        if (data.translatedText) {
          setNoteText(data.translatedText)
          showToast(`Translated to ${langName}!`, 'success')
          setLoading(false)
          return
        }
      }
    } catch {}

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`
      const res = await fetch(url)
      const parsed = await res.json()
      const translated = parsed[0].map((item) => item[0]).join('')
      if (translated) {
        setNoteText(translated)
        showToast(`Translated to ${langName}!`, 'success')
        setLoading(false)
        return
      }
    } catch {}

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|${targetLang}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        setNoteText(data.responseData.translatedText)
        showToast(`Translated to ${langName}!`, 'success')
      } else {
        setMessage('Translation failed. Try shorter text.')
      }
    } catch (e) {
      setMessage('No internet: ' + e.message)
    }
    setLoading(false)
  }

  // ============================================================
  //  TASKS FUNCTIONS
  // ============================================================

  async function fetchTasks() {
    if (!user) return
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Fetch tasks error:', error)
    } else {
      setTasks(data || [])
      const subtaskMap = {}
      data?.forEach((t) => {
        subtaskMap[t.id] = t.subtasks || []
      })
      setSubTasks(subtaskMap)
    }
  }

  async function addTask() {
    if (!task.trim() || !user) return
    setTaskSaving(true)

    let dueDate = selectedDate
    let taskType = 'task'

    if (taskCategory === 'daily') {
      taskType = 'habit'
      dueDate = new Date().toISOString().split('T')[0]
    } else if (taskCategory === 'weekly') {
      taskType = 'habit'
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = days.indexOf(taskWeekDay)
      const today = new Date()
      const diff = (targetDay - today.getDay() + 7) % 7
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + diff)
      dueDate = nextDate.toISOString().split('T')[0]
    } else if (taskCategory === 'custom') {
      dueDate = taskDueDate || selectedDate
    }

    const subtasksArray = subTasksToAdd.map((st) => ({
      id: st.id,
      text: st.text,
      done: false
    }))

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      content: task.trim(),
      category: taskCategory,
      type: taskType,
      weekday: taskCategory === 'weekly' ? taskWeekDay : null,
      time: taskCategory === 'daily' ? taskTime : null,
      due_date: dueDate,
      difficulty: taskDifficulty,
      estimated_minutes: taskMinutes,
      category_tag: taskTag,
      done: false,
      subtasks: subtasksArray
    })

    if (error) {
      setMessage('Error adding task: ' + error.message)
    } else {
      setTask('')
      setTaskTime('')
      setTaskDueDate('')
      setTaskMinutes(30)
      setTaskTag('general')
      setSubTasksToAdd([])
      setNewSubTask('')
      showToast('Task added!', 'success')
      fetchTasks()
    }
    setTaskSaving(false)
  }

  async function toggleTask(id) {
    const task = tasks.find((t) => t.id === id)
    const { error } = await supabase
      .from('tasks')
      .update({ done: !task.done, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      if (!task.done) {
        showToast('Task completed!', 'success')
      }
      fetchTasks()
    }
  }

  async function deleteTask(id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      showToast('Task deleted', 'success', () => {})
      fetchTasks()
    }
  }

  // ============================================================
  //  SUBTASKS
  // ============================================================

  const addSubTask = async (taskId) => {
    if (!newSubTask.trim()) return
    const currentSubtasks = subTasks[taskId] || []
    const updatedSubtasks = [
      ...currentSubtasks,
      { id: Date.now().toString(), text: newSubTask.trim(), done: false }
    ]

    const { error } = await supabase
      .from('tasks')
      .update({ subtasks: updatedSubtasks })
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (!error) {
      setSubTasks((prev) => ({ ...prev, [taskId]: updatedSubtasks }))
      setNewSubTask('')
      showToast('Subtask added', 'success')
    }
  }

  const toggleSubTask = async (taskId, subTaskId) => {
    const currentSubtasks = subTasks[taskId] || []
    const updatedSubtasks = currentSubtasks.map((st) =>
      st.id === subTaskId ? { ...st, done: !st.done } : st
    )

    const { error } = await supabase
      .from('tasks')
      .update({ subtasks: updatedSubtasks })
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (!error) {
      setSubTasks((prev) => ({ ...prev, [taskId]: updatedSubtasks }))
    }
  }

  const deleteSubTask = async (taskId, subTaskId) => {
    const currentSubtasks = subTasks[taskId] || []
    const updatedSubtasks = currentSubtasks.filter((st) => st.id !== subTaskId)

    const { error } = await supabase
      .from('tasks')
      .update({ subtasks: updatedSubtasks })
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (!error) {
      setSubTasks((prev) => ({ ...prev, [taskId]: updatedSubtasks }))
      showToast('Subtask deleted', 'success')
    }
  }

  // ============================================================
  //  JOURNAL FUNCTIONS
  // ============================================================

  async function fetchJournal() {
    if (!user) return
    let query = supabase
      .from('journal')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (journalDateFilter) {
      query = query.eq('date', journalDateFilter)
    }

    const { data, error } = await query
    if (error) {
      console.error('Fetch journal error:', error)
    } else {
      setJournalEntries(data || [])
    }
  }

  async function saveJournal() {
    if (!journalEntry.trim() || !user) return
    setJournalSaving(true)

    const { error } = await supabase.from('journal').insert({
      user_id: user.id,
      content: journalEntry.trim(),
      date: new Date().toISOString().split('T')[0],
      mood: journalMood.trim(),
      tags: journalTags.trim()
    })

    if (error) {
      setMessage('Error saving journal: ' + error.message)
    } else {
      setJournalEntry('')
      setJournalMood('')
      setJournalTags('')
      showToast('Journal entry saved!', 'success')
      fetchJournal()
    }
    setJournalSaving(false)
  }

  async function deleteJournalEntry(id) {
    const { error } = await supabase
      .from('journal')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      showToast('Entry deleted', 'success')
      fetchJournal()
    }
  }

  // ============================================================
  //  POMODORO FUNCTIONS
  // ============================================================

  async function fetchPomodoroStats() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('date', today)
      .eq('user_id', user.id)
    if (data && data[0]) {
      setPomodoroSessions(data[0].sessions_completed || 0)
      setTotalMinutes(data[0].total_minutes || 0)
    }
  }

  const togglePomodoro = () => {
    if (!pomodoroRunning && pomodoroTime === 0) {
      setPomodoroTime(focusDuration * 60)
      setIsBreak(false)
    }
    setPomodoroRunning(!pomodoroRunning)
    setPomodoroState(!pomodoroRunning ? 'running' : 'paused')
  }

  const resetPomodoro = () => {
    setPomodoroRunning(false)
    setIsBreak(false)
    setPomodoroTime(Math.round(focusDuration * 60))
    setPomodoroState('idle')
    setShowCelebration(false)
  }

  const handlePomodoroComplete = async () => {
    if (!isBreak) {
      const newSessions = pomodoroSessions + 1
      const newMinutes = totalMinutes + focusDuration
      setPomodoroSessions(newSessions)
      setTotalMinutes(newMinutes)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)

      const today = new Date().toISOString().split('T')[0]
      await supabase.from('pomodoro_sessions').upsert({
        user_id: user.id,
        date: today,
        sessions_completed: newSessions,
        total_minutes: newMinutes
      })
      showToast('Focus Session Complete! Take a break.', 'success')
      setPomodoroTime(Math.round(breakDuration * 60))
    } else {
      showToast('Break over. Ready to focus?', 'success')
      setPomodoroTime(Math.round(focusDuration * 60))
    }
    setIsBreak(!isBreak)
    setPomodoroRunning(false)
    setPomodoroState('finished')
  }

  // ============================================================
  //  EXPORT FUNCTIONS
  // ============================================================

  const toggleSelect = (id) => {
    setSelectedNotes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const exportNotesPDF = () => {
    const notesToExport = showExport ? notes.filter((n) => selectedNotes.includes(n.id)) : notes
    if (notesToExport.length === 0) {
      setMessage(showExport ? 'Select notes to export' : 'No notes to export')
      return
    }
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`Discypln Notes - ${selectedDate}`, 20, 20)
    let yPos = 40
    notesToExport.forEach((note, idx) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      doc.setFontSize(14)
      doc.text(`${idx + 1}. ${note.title}`, 20, yPos)
      doc.setFontSize(11)
      const splitText = doc.splitTextToSize(note.content, 170)
      splitText.forEach((line) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.text(line, 20, yPos)
        yPos += 6
      })
      doc.text(`Category: ${note.category || 'Uncategorized'}`, 20, yPos)
      yPos += 12
    })
    doc.save(`discypln-notes-${selectedDate}.pdf`)
    showToast('PDF exported!', 'success')
    setShowExport(false)
    setSelectedNotes([])
  }

  const exportTasksWord = async () => {
    if (tasks.length === 0) {
      setMessage('No tasks to export')
      return
    }
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Discypln Tasks', bold: true, size: 32 })]
            }),
            ...tasks.map((t) =>
              new Paragraph({
                children: [
                  new TextRun({ text: t.done ? '✓ ' : '☐ ', bold: true }),
                  new TextRun({ text: t.content }),
                  new TextRun({ text: ` [${t.category}]`, italics: true, size: 20 }),
                  new TextRun({
                    text: t.category_tag && t.category_tag !== 'general' ? ` #${t.category_tag}` : '',
                    italics: true,
                    size: 20
                  })
                ]
              })
            )
          ]
        }
      ]
    })
    const blob = await Packer.toBlob(doc)
    saveAs(blob, 'discypln-tasks.docx')
    showToast('Word file exported!', 'success')
  }

  const exportWeeklyReport = async () => {
    const autoTable = (await import('jspdf-autotable')).default

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const weekStr = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`

    const weekTasks = tasks.filter((t) => {
      if (!t.done) return false
      const taskDate = new Date(t.updated_at || t.due_date)
      return taskDate >= startOfWeek && taskDate <= endOfWeek
    })

    const totalMins = weekTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)

    const categoryStats = {}
    weekTasks.forEach((t) => {
      const cat = t.category_tag || 'Uncategorized'
      if (!categoryStats[cat]) categoryStats[cat] = { count: 0, mins: 0 }
      categoryStats[cat].count += 1
      categoryStats[cat].mins += t.estimated_minutes || 0
    })

    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Discypln Weekly Report - Tasks', 14, 20)
    doc.setFontSize(12)
    doc.text(`Week: ${weekStr}`, 14, 30)
    doc.text(`Tasks Completed: ${weekTasks.length}`, 14, 38)
    doc.text(`Total Focus Time: ${formatMinutes(totalMins)}`, 14, 46)
    doc.text(`Current Streak: ${getStreak()} days`, 14, 54)

    let yPos = 54
    Object.entries(categoryStats).forEach(([cat, stats]) => {
      yPos += 7
      doc.setFontSize(11)
      doc.text(`• ${cat}: ${stats.count} tasks, ${formatMinutes(stats.mins)}`, 14, yPos)
    })

    autoTable(doc, {
      startY: yPos + 10,
      head: [['Date', 'Task', 'Category', 'Time']],
      body: weekTasks.map((t) => [
        new Date(t.updated_at || t.due_date).toLocaleDateString(),
        t.content,
        t.category_tag,
        formatMinutes(t.estimated_minutes)
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    })

    doc.save(`Discypln_Weekly_Tasks_${weekStr.replace(/\//g, '-')}.pdf`)
    showToast('Weekly report generated!', 'success')
  }

  // ============================================================
  //  VOICE FUNCTIONS
  // ============================================================

  const toggleMic = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          recognitionRef.current.start()
          setIsListening(true)
          setMessage('Say comma, full stop, new line for punctuation')
        })
        .catch(() => {
          setMessage('Microphone permission denied')
          setIsListening(false)
        })
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsProcessing(true)
    setMessage('Reading image...')
    Tesseract.recognize(file, 'eng', {
      logger: (m) => console.log(m.status, m.progress)
    })
      .then(({ data: { text } }) => {
        setNoteText((prev) => prev + (prev ? '\n\n' : '') + text)
        setMessage('Text extracted!')
        setIsProcessing(false)
        e.target.value = ''
      })
      .catch(() => {
        setMessage('Failed to read image')
        setIsProcessing(false)
      })
  }

  // ============================================================
  //  MEMOIZED FILTERS
  // ============================================================

  const allCategories = useMemo(
    () => ['All', ...new Set(notes.map((n) => n.category || 'Uncategorized'))],
    [notes]
  )

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        activeNoteCategory === 'All' || (note.category || 'Uncategorized') === activeNoteCategory
      return matchesSearch && matchesCategory
    })
  }, [notes, searchQuery, activeNoteCategory])

  const filteredTasks = useMemo(() => {
    return activeCategory === 'all'
      ? [...tasks].sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
      : tasks
          .filter((t) => t.category === activeCategory)
          .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
  }, [tasks, activeCategory])

  const weeklyTasks = tasks.filter(t => t.category === 'weekly')
  const weeklyCompleted = weeklyTasks.filter(t => t.done).length
  const weeklyScore = weeklyTasks.length > 0 ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) : 0
  const streak = getStreak()
  const failedDays = getFailedDays()

  // ============================================================
  //  RENDER
  // ============================================================

  if (!user) {
    return (
      <>
        <div className="bg-glow" />
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', position: 'relative', zIndex: 1 }}>
          <div className="glass glass-heavy" style={{ maxWidth: '400px', width: '100%', padding: '32px', borderRadius: 'var(--radius-2xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginBottom: '12px' }}>
              <LogoIcon className="logo-svg" style={{ width: '48px', height: '48px' }} />
              <span className="hero-title" style={{ fontSize: '32px' }}>iscypln</span>
            </div>
            <p className="text-secondary text-center" style={{ marginBottom: '24px', fontSize: '14px' }}>Stay focused. Stay disciplined.</p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              style={{ marginBottom: '12px', width: '100%', padding: '12px 16px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: '15px', outline: 'none' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              style={{ marginBottom: '16px', width: '100%', padding: '12px 16px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: '15px', outline: 'none' }}
            />
            <div className="flex gap-3">
              <button onClick={signIn} disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                {loading ? 'Loading...' : 'Sign In'}
              </button>
              <button onClick={signUp} disabled={loading} className="btn btn-ghost" style={{ flex: 1 }}>
                {loading ? 'Loading...' : 'Sign Up'}
              </button>
            </div>
            {message && (
              <p className="text-center" style={{ marginTop: '16px', color: 'var(--brand-blue)', fontSize: '13px' }}>
                {message}
              </p>
            )}
          </div>
        </div>
      </>
    )
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <>
        <div className="bg-glow" />
        <div className="container" style={{ maxWidth: '900px', position: 'relative', zIndex: 1 }}>
          <header className="app-header">
            <div className="header-left">
              <button onClick={goBack} className="btn btn-ghost" style={{ fontSize: '18px', padding: '8px 12px', gap: '6px' }}>
                <IconBack /> <span>Back</span>
              </button>
            </div>
            <div className="header-right" style={{ gap: '8px' }}>
              <div className="flex items-center gap-2">
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="select"
                  style={{ padding: '8px 12px', fontSize: '12px', width: 'auto', minWidth: '100px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                >
                  {ALL_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <button onClick={translateNote} className="btn btn-ghost btn-sm" style={{ padding: '8px 10px' }}>
                  <IconTranslate />
                </button>
                <button
                  onClick={saveNote}
                  disabled={isSaving}
                  className="btn btn-primary btn-sm"
                  style={{ minWidth: '80px', gap: '6px' }}
                >
                  <IconSave /> {isSaving ? 'Saving...' : 'Save'}
                </button>
                {saveStatus && (
                  <span className="tiny-label" style={{ color: 'var(--brand-blue)' }}>
                    {saveStatus}
                  </span>
                )}
              </div>
            </div>
          </header>

          <div style={{ marginTop: '16px' }}>
            {viewMode === 'add' && (
              <>
                <select
                  value={titleFont}
                  onChange={(e) => setTitleFont(e.target.value)}
                  className="select"
                  style={{ marginBottom: '10px', width: '100%', padding: '12px 16px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                >
                  <option value="Inter">Inter - Clean</option>
                  <option value="Georgia">Georgia - Book</option>
                  <option value="Poppins">Poppins - Modern</option>
                  <option value="Merriweather">Merriweather - Readable</option>
                  <option value="'Times New Roman'">Times - Classic</option>
                  <option value="Arial">Arial - Simple</option>
                  <option value="Pacifico">Pacifico - Cursive</option>
                  <option value="Caveat">Caveat - Handwriting</option>
                </select>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="input"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '24px',
                    fontWeight: 600,
                    fontFamily: titleFont.includes(' ') ? `'${titleFont}', serif` : titleFont,
                    marginBottom: '10px',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-blur)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Add a category"
                  className="input"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    marginBottom: '12px',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-blur)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </>
            )}
            {viewMode === 'edit' && (
              <>
                <h2 className="card-title" style={{ marginBottom: '12px' }}>{title}</h2>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Add a category"
                  className="input"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    marginBottom: '12px',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-blur)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </>
            )}
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Start typing..."
              className="textarea"
              style={{
                width: '100%',
                minHeight: '320px',
                padding: '16px',
                fontFamily: detectedCode ? "'JetBrains Mono', monospace" : fontFamily.includes(' ') ? `'${fontFamily}', serif` : fontFamily,
                fontSize: fontSize + 'px',
                background: detectedCode ? '#0d1117' : 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                lineHeight: '1.7'
              }}
              autoFocus
            />
          </div>

          <nav
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--glass-border)',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={toggleMic}
              className={`btn btn-ghost btn-sm ${isListening ? 'btn-danger' : ''}`}
              style={{ gap: '6px' }}
            >
              {isListening ? <IconMicOff /> : <IconMic />}
              {isListening ? ' Stop' : ' Voice'}
            </button>
            <button onClick={() => fileInputRef.current.click()} className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
              <IconImage /> Scan
            </button>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="select"
              style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', minWidth: '100px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
            >
              <option value="Inter">Inter</option>
              <option value="Georgia">Georgia</option>
              <option value="'Times New Roman'">Times</option>
              <option value="'Courier New'">Courier</option>
              <option value="Arial">Arial</option>
              <option value="Poppins">Poppins</option>
              <option value="'Roboto Slab'">Roboto Slab</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Lora">Lora</option>
              <option value="Merriweather">Merriweather</option>
              <option value="Ubuntu">Ubuntu</option>
              <option value="Quicksand">Quicksand</option>
              <option value="Caveat">Caveat</option>
              <option value="Pacifico">Pacifico</option>
            </select>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="select"
              style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', minWidth: '70px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
            >
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
              <option value="20">20px</option>
              <option value="24">24px</option>
            </select>
            {viewMode === 'edit' && (
              <>
                <button
                  onClick={() => navigator.clipboard.writeText(noteText)}
                  className="btn btn-ghost btn-sm"
                  style={{ gap: '6px' }}
                >
                  <IconCopy /> Copy
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this note?')) deleteNote(editingNote.id)
                  }}
                  className="btn btn-danger btn-sm"
                  style={{ gap: '6px' }}
                >
                  <IconTrash /> Delete
                </button>
                <button onClick={shareNote} className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
                  <IconShare /> Share
                </button>
              </>
            )}
          </nav>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          {message && (
            <p
              className="text-center"
              style={{
                marginTop: '16px',
                color: message.includes('✅') ? 'var(--brand-blue)' : 'var(--text-muted)',
                fontSize: '13px'
              }}
            >
              {message}
            </p>
          )}
        </div>
      </>
    )
  }

  // ============================================================
  //  MAIN DASHBOARD
  // ============================================================

  const greeting = getGreeting()

  return (
    <>
      <div className="bg-glow" />
      <div className="container fade-in" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* ===== HEADER ===== */}
        <header className="app-header">
          <div className="header-left">
            <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
              <LogoIcon className="logo-svg" style={{ width: '40px', height: '40px' }} />
              <span className="logo-text" style={{ 
                fontSize: '26px', 
                fontWeight: 900, 
                letterSpacing: '-0.03em',
                marginLeft: '-4px',
                background: 'var(--gradient-primary)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'gradientShift 15s ease infinite'
              }}>
                iscypln
              </span>
            </div>
            <div className="header-center">
              <span className="greeting-text">
                {greeting}{' '}
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
              <span className="date-text">
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
          <div className="header-right">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="theme-toggle" aria-label="Toggle theme">
              {isDarkMode ? <IconMoon /> : <IconSun />}
            </button>
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="btn btn-ghost btn-icon"
                style={{ padding: '0' }}
              >
                <IconMenuDots />
              </button>
              {showUserMenu && (
                <div
                  className="glass glass-heavy"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '200px',
                    borderRadius: 'var(--radius-lg)',
                    padding: '8px',
                    zIndex: 100,
                    animation: 'slideDown 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      borderBottom: '1px solid var(--glass-border)',
                      marginBottom: '4px'
                    }}
                  >
                    {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      setIsDarkMode(!isDarkMode)
                      setShowUserMenu(false)
                    }}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 14px' }}
                  >
                    {isDarkMode ? <IconMoon /> : <IconSun />} {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </button>
                  <button
                    onClick={() => {
                      signOut()
                      setShowUserMenu(false)
                    }}
                    className="btn btn-ghost"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      gap: '10px',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid var(--glass-border)',
                      marginTop: '4px',
                      padding: '10px 14px'
                    }}
                  >
                    <IconLogout /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ===== CAPSULE NAV (DeepSeek style) ===== */}
        <nav className="capsule-nav">
          <div className="capsule-nav-inner">
            {['notes', 'tasks', 'journal'].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? 'active' : ''}
                onClick={() => {
                  setActiveTab(tab)
                  if (tab === 'journal') fetchJournal()
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </nav>

        {/* ===== HERO CARD WITH STATS (ONLY THIS HAS GLOW) ===== */}
        <div className="stats-hero" style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
            position: 'relative',
            zIndex: 1
          }}>
            <div>
              <div className="hero-title" style={{ fontSize: '36px', marginBottom: '2px' }}>
                {greeting}
              </div>
              <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                {user?.email?.split('@')[0] || 'User'} 
                <span style={{ marginLeft: '12px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="discipline-badge">
                <IconTrophy size={16} style={{ marginRight: '4px' }} />
                {statsData.disciplineBadge} {statsData.disciplineLevel}
                <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: '4px' }}>
                  {statsData.disciplineScore}/100
                </span>
              </div>
              <button
                onClick={() => setShowStatsModal(true)}
                className="btn btn-ghost btn-sm"
                style={{ 
                  borderRadius: '999px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  height: '32px',
                  gap: '4px'
                }}
              >
                View More <IconChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#F59E0B' }}>
                <IconTarget size={16} color="#F59E0B" style={{ marginRight: '4px' }} />
                {streak}
              </div>
              <div className="stat-label">Streak</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--brand-blue)' }}>
                <IconTrendingUp size={16} color="var(--brand-blue)" style={{ marginRight: '4px' }} />
                {statsData.commitmentRate}%
              </div>
              <div className="stat-label">Commitment</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#22C55E' }}>
                <IconClock size={16} color="#22C55E" style={{ marginRight: '4px' }} />
                {formatMinutes(totalMinutes)}
              </div>
              <div className="stat-label">Focus</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: 'var(--brand-purple)' }}>
                <IconCheck size={16} color="var(--brand-purple)" style={{ marginRight: '4px' }} />
                {tasks.filter(t => t.done).length}
              </div>
              <div className="stat-label">Tasks Done</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#A855F7' }}>
                <IconTarget size={16} color="#A855F7" style={{ marginRight: '4px' }} />
                {statsData.habitCompletion}%
              </div>
              <div className="stat-label">Habits</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#F97316' }}>
                <IconCalendar size={16} color="#F97316" style={{ marginRight: '4px' }} />
                {statsData.dailyAverage}
              </div>
              <div className="stat-label">Daily Avg</div>
            </div>
          </div>

          {/* Streak Protection Warning */}
          {statsData.streakEndangered && (
            <div style={{
              marginTop: '12px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              position: 'relative',
              zIndex: 1
            }}>
              <IconAlertTriangle size={18} color="var(--text-muted)" />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {statsData.daysUntilStreakLoss} day{statsData.daysUntilStreakLoss > 1 ? 's' : ''} until streak loss!
                {statsData.nextMilestone > 0 && ` Complete today to reach ${statsData.nextMilestone} days`}
              </span>
            </div>
          )}
        </div>

        {/* ===== POMODORO ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div
                style={{
                  fontSize: '56px',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--text-primary)',
                  letterSpacing: '-1px',
                  lineHeight: 1,
                  padding: '8px 0'
                }}
              >
                {formatTime(pomodoroTime)}
              </div>
              <div
                style={{
                  position: 'absolute',
                  inset: '-8px',
                  borderRadius: '50%',
                  border: '2px solid transparent',
                  borderColor: pomodoroRunning ? 'var(--brand-blue)' : pomodoroState === 'paused' ? '#F59E0B' : 'transparent',
                  opacity: pomodoroRunning ? 0.3 : 0.1,
                  transition: 'all 0.3s ease'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="tiny-label">Focus</span>
                <input
                  type="number"
                  min="10"
                  max="60"
                  value={focusDuration}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (!isNaN(val) && val >= 10 && val <= 60) {
                      setFocusDuration(val)
                      if (!pomodoroRunning && !isBreak) setPomodoroTime(val * 60)
                    }
                  }}
                  className="input"
                  style={{ width: '60px', padding: '4px 6px', fontSize: '14px', textAlign: 'center', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                />
                <span className="tiny-label">min</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="tiny-label">Break</span>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={breakDuration}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (!isNaN(val) && val >= 1 && val <= 15) {
                      setBreakDuration(val)
                      if (!pomodoroRunning && isBreak) setPomodoroTime(val * 60)
                    }
                  }}
                  className="input"
                  style={{ width: '60px', padding: '4px 6px', fontSize: '14px', textAlign: 'center', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                />
                <span className="tiny-label">min</span>
              </div>
            </div>

            <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isBreak ? 'Break Time' : 'Focus Session'}
              <span style={{ marginLeft: '12px', color: 'var(--text-tertiary)' }}>
                {pomodoroSessions} sessions
              </span>
              <span style={{ marginLeft: '12px', color: 'var(--text-tertiary)' }}>
                {formatMinutes(totalMinutes)} total
              </span>
            </div>

            <div className="progress-bar" style={{ marginTop: '16px', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${((focusDuration * 60 - pomodoroTime) / (focusDuration * 60)) * 100}%`
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={togglePomodoro}
                className={`btn ${pomodoroRunning ? 'btn-danger' : 'btn-primary'}`}
                style={{ minWidth: '100px', gap: '6px' }}
              >
                {pomodoroRunning ? <IconPause /> : <IconPlay />}
                {pomodoroRunning ? ' Pause' : pomodoroState === 'paused' ? ' Resume' : ' Start'}
              </button>
              <button onClick={resetPomodoro} className="btn btn-ghost" style={{ gap: '6px' }}>
                <IconReset /> Reset
              </button>
            </div>

            {showCelebration && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: 'rgba(34, 197, 94, 0.10)',
                  borderRadius: 'var(--radius-md)',
                  color: '#22C55E',
                  fontSize: '14px',
                  fontWeight: 600,
                  animation: 'fadeIn 0.5s ease'
                }}
              >
                <IconSparkle /> Focus Session Complete!
              </div>
            )}
          </div>
        </div>

        {/* ===== HEATMAP ===== */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div className="card-title" style={{ marginBottom: '0' }}>Heatmap</div>
              <div className="caption" style={{ marginTop: '2px' }}>
                {tasks.filter((t) => t.done).length} tasks done in last 30 days
              </div>
            </div>
          </div>
          <div className="heatmap-grid">
            {Array.from({ length: 30 }).map((_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (29 - i))
              const dateStr = date.toISOString().split('T')[0]

              const dayTasks = tasks.filter((t) => {
                if (!t.done) return false
                const taskDate = new Date(t.updated_at || t.due_date).toISOString().split('T')[0]
                return taskDate === dateStr
              })

              const minutes = dayTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
              const intensity = minutes === 0 ? 0 : minutes < 30 ? 1 : minutes < 60 ? 2 : minutes < 120 ? 3 : 4
              const colors = ['transparent', 'rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.4)', 'rgba(34, 197, 94, 0.6)', 'rgba(34, 197, 94, 0.9)']
              const isToday = dateStr === new Date().toISOString().split('T')[0]

              return (
                <div
                  key={dateStr}
                  className={`heatmap-cell ${isToday ? 'today' : ''}`}
                  title={`${dateStr}: ${dayTasks.length} tasks, ${formatMinutes(minutes)}`}
                  style={{
                    background: colors[intensity],
                    borderColor: isToday ? 'var(--brand-blue)' : 'var(--glass-border)',
                    borderWidth: isToday ? '2px' : '1px'
                  }}
                >
                  {date.getDate()}
                </div>
              )
            })}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '12px',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}
          >
            <span>Less</span>
            {['transparent', 'rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.4)', 'rgba(34, 197, 94, 0.6)', 'rgba(34, 197, 94, 0.9)'].map((color) => (
              <div
                key={color}
                style={{
                  width: '16px',
                  height: '16px',
                  background: color,
                  borderRadius: '3px',
                  border: '1px solid var(--glass-border)'
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* ===== FAILED DAYS ===== */}
        {failedDays.length > 0 && (
          <div
            className="card"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.3)',
              marginBottom: '16px',
              padding: '16px 20px'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Failed Days This Week
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {failedDays.map((day) => (
                <span key={day.date} className="text-secondary" style={{ fontSize: '13px' }}>
                  {formatDate(day.date)}: {day.completed}/{day.total} habits
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ===== CONTENT AREA ===== */}
        <div className="card" style={{ minHeight: '400px', padding: '24px' }}>
          
          {/* ===== NOTES TAB ===== */}
          {activeTab === 'notes' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div className="section-title" style={{ marginBottom: 0 }}>Notes</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {selectionMode && (
                    <>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {selectedNotes.length} selected
                      </span>
                      <button
                        onClick={() => {
                          if (selectedNotes.length === filteredNotes.length) {
                            setSelectedNotes([])
                          } else {
                            setSelectedNotes(filteredNotes.map(n => n.id))
                          }
                        }}
                        className="btn btn-sm btn-ghost"
                        style={{
                          borderRadius: '999px',
                          padding: '6px 16px',
                          fontSize: '12px',
                          height: '32px'
                        }}
                      >
                        {selectedNotes.length === filteredNotes.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <button
                        onClick={() => {
                          if (selectedNotes.length === 0) {
                            showToast('Select notes first', 'error')
                            return
                          }
                          if (confirm(`Delete ${selectedNotes.length} selected note(s)?`)) {
                            deleteMultipleNotes()
                          }
                        }}
                        className="btn btn-danger btn-sm"
                        style={{
                          borderRadius: '999px',
                          padding: '6px 16px',
                          fontSize: '12px',
                          height: '32px',
                          gap: '4px'
                        }}
                      >
                        <IconTrash /> Delete {selectedNotes.length > 0 && `(${selectedNotes.length})`}
                      </button>
                      <button
                        onClick={() => {
                          if (selectedNotes.length === 0) {
                            showToast('Select notes to export', 'error')
                            return
                          }
                          exportSelectedNotes()
                        }}
                        className="btn btn-primary btn-sm"
                        style={{
                          borderRadius: '999px',
                          padding: '6px 16px',
                          fontSize: '12px',
                          height: '32px'
                        }}
                      >
                        Export {selectedNotes.length > 0 && `(${selectedNotes.length})`}
                      </button>
                      <button
                        onClick={() => {
                          setSelectionMode(false)
                          setSelectedNotes([])
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{
                          borderRadius: '999px',
                          padding: '6px 16px',
                          fontSize: '12px',
                          height: '32px'
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {!selectionMode && (
                    <>
                      <button
                        onClick={() => {
                          setSelectionMode(true)
                          setSelectedNotes([])
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{
                          borderRadius: '999px',
                          padding: '6px 16px',
                          fontSize: '12px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Select
                      </button>
                      <button
                        onClick={openAddNote}
                        className="btn btn-primary"
                        style={{
                          borderRadius: '999px',
                          padding: '6px 20px',
                          fontSize: '12px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <IconPlus /> New
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="section-subtitle">Capture, organize and retrieve information quickly.</div>

              {/* Search Bar */}
              <div className="search-wrapper" style={{ position: 'relative', marginBottom: '16px' }}>
                <span className="search-icon" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <IconSearch />
                </span>
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 16px 10px 44px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-blur)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--brand-blue)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(79, 140, 255, 0.10)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--glass-border)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <IconX />
                  </button>
                )}
              </div>

              {/* Category Tabs */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {allCategories.map((cat) => {
                  const count = cat === 'All' 
                    ? notes.length 
                    : notes.filter((n) => (n.category || 'Uncategorized') === cat).length
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveNoteCategory(cat)}
                      className={`btn btn-sm ${activeNoteCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                      style={{
                        borderRadius: '999px',
                        padding: '6px 16px',
                        fontSize: '12px',
                        height: '32px',
                        background: activeNoteCategory === cat ? 'var(--gradient-primary)' : 'transparent',
                        color: activeNoteCategory === cat ? 'var(--text-inverse)' : 'var(--text-secondary)',
                        borderColor: activeNoteCategory === cat ? 'transparent' : 'var(--glass-border)'
                      }}
                    >
                      {cat} ({count})
                    </button>
                  )
                })}
              </div>

              {/* Notes Grid */}
              {filteredNotes.length > 0 ? (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                  gap: '16px',
                  alignItems: 'start'
                }}>
                  {filteredNotes.map((note, index) => {
                    const isSelected = selectedNotes.includes(note.id)
                    return (
                      <div
                        key={note.id}
                        className="card"
                        onClick={() => {
                          if (selectionMode) {
                            toggleSelect(note.id)
                          } else {
                            openEditNote(note)
                          }
                        }}
                        style={{
                          cursor: selectionMode ? 'pointer' : 'pointer',
                          padding: '20px',
                          transition: 'all 0.2s ease',
                          border: selectionMode && isSelected 
                            ? '2px solid var(--brand-blue)' 
                            : selectionMode 
                              ? '2px solid var(--glass-border)' 
                              : '1px solid var(--glass-border)',
                          borderRadius: 'var(--radius-xl)',
                          background: selectionMode && isSelected 
                            ? 'rgba(79, 140, 255, 0.06)' 
                            : 'var(--glass-bg)',
                          transform: selectionMode && isSelected ? 'scale(0.98)' : 'scale(1)',
                          position: 'relative',
                          animation: `slideUp 0.5s var(--spring) both`,
                          animationDelay: `${index * 40}ms`
                        }}
                        onMouseEnter={(e) => {
                          if (!selectionMode) {
                            e.currentTarget.style.borderColor = 'var(--glass-border-hover)'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectionMode) {
                            e.currentTarget.style.borderColor = 'var(--glass-border)'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }
                        }}
                      >
                        {selectionMode && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              border: isSelected ? '2px solid var(--brand-blue)' : '2px solid var(--text-muted)',
                              background: isSelected ? 'var(--brand-blue)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 700,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {isSelected && <IconCheck />}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.3,
                              flex: 1,
                              marginRight: '8px'
                            }}
                          >
                            {note.title || 'Untitled'}
                          </div>
                          <span
                            className="chip chip-tag"
                            style={{
                              flexShrink: 0,
                              marginTop: '2px',
                              fontSize: '10px',
                              height: '24px',
                              padding: '0 10px'
                            }}
                          >
                            {note.category || 'Uncategorized'}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                            marginTop: '8px'
                          }}
                        >
                          {note.content || 'No content'}
                        </div>

                        <div
                          style={{
                            marginTop: '12px',
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>
                            Updated {formatDate(note.date)}
                            <span style={{ marginLeft: '8px', opacity: 0.5 }}>•</span>
                            <span style={{ marginLeft: '8px' }}>{getWordCount(note.content)} words</span>
                            <span style={{ marginLeft: '8px', opacity: 0.5 }}>•</span>
                            <span style={{ marginLeft: '8px' }}>{getReadingTime(note.content)} min read</span>
                          </span>
                          <span style={{ fontSize: '11px', opacity: 0.6 }}>{formatNoteTime(note.created_at)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📭</div>
                  <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-secondary)' }}>
                    No notes available.
                  </p>
                  <p style={{ fontSize: '14px', marginTop: '4px', color: 'var(--text-tertiary)' }}>
                    Create your first note to start building your knowledge base.
                  </p>
                  <button onClick={openAddNote} className="btn btn-primary" style={{ marginTop: '16px', gap: '6px' }}>
                    <IconPlus /> New Note
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== TASKS TAB ===== */}
          {activeTab === 'tasks' && (
            <div>
              <div className="section-title">Tasks</div>
              <div className="section-subtitle">Organize your day efficiently.</div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {['all', 'daily', 'weekly', 'custom'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      borderRadius: '999px',
                      padding: '6px 16px',
                      fontSize: '12px',
                      height: '32px',
                      background: activeCategory === cat ? 'var(--gradient-primary)' : 'transparent',
                      color: activeCategory === cat ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      borderColor: activeCategory === cat ? 'transparent' : 'var(--glass-border)'
                    }}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              <div
                className="glass"
                style={{
                  padding: '20px',
                  marginBottom: '16px',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <input
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Add a task..."
                  className="input"
                  style={{ marginBottom: '12px', width: '100%', padding: '12px 16px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="select"
                    style={{ flex: 1, minWidth: '120px', padding: '10px 12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">One-time</option>
                  </select>

                  {taskCategory === 'daily' && (
                    <input
                      type="time"
                      value={taskTime}
                      onChange={(e) => setTaskTime(e.target.value)}
                      className="input"
                      style={{ width: '140px', padding: '10px 12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  )}

                  {taskCategory === 'weekly' && (
                    <select
                      value={taskWeekDay}
                      onChange={(e) => setTaskWeekDay(e.target.value)}
                      className="select"
                      style={{ width: '140px', padding: '10px 12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  )}

                  {taskCategory === 'custom' && (
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="input"
                      style={{ width: '160px', padding: '10px 12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="tiny-label" style={{ minWidth: '60px' }}>Difficulty</span>
                    <select
                      value={taskDifficulty}
                      onChange={(e) => setTaskDifficulty(e.target.value)}
                      className="select"
                      style={{ width: '140px', padding: '8px 12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>

                    <span className="tiny-label" style={{ minWidth: '50px' }}>Mins</span>
                    <input
                      type="number"
                      value={taskMinutes}
                      onChange={(e) => setTaskMinutes(Number(e.target.value))}
                      placeholder="30"
                      className="input"
                      style={{ width: '80px', padding: '8px 12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                    />

                    <span className="tiny-label" style={{ minWidth: '30px' }}>Tag</span>
                    <select
                      value={taskTag}
                      onChange={(e) => setTaskTag(e.target.value)}
                      className="select"
                      style={{ width: '140px', padding: '8px 12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="general">General</option>
                      <option value="school">School</option>
                      <option value="work">Work</option>
                      <option value="health">Health</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      value={newSubTask}
                      onChange={(e) => setNewSubTask(e.target.value)}
                      placeholder="Add a subtask"
                      className="input"
                      style={{ flex: 1, maxWidth: '260px', fontSize: '13px', padding: '6px 12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newSubTask.trim()) {
                          setSubTasksToAdd([
                            ...subTasksToAdd,
                            { id: Date.now().toString(), text: newSubTask.trim(), done: false }
                          ])
                          setNewSubTask('')
                          showToast('Subtask added!', 'success')
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newSubTask.trim()) {
                          setSubTasksToAdd([
                            ...subTasksToAdd,
                            { id: Date.now().toString(), text: newSubTask.trim(), done: false }
                          ])
                          setNewSubTask('')
                          showToast('Subtask added!', 'success')
                        }
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      Add
                    </button>
                  </div>

                  {subTasksToAdd.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {subTasksToAdd.map((st) => (
                        <div
                          key={st.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '4px 10px',
                            background: 'rgba(79, 140, 255, 0.06)',
                            borderRadius: '6px',
                            width: 'fit-content'
                          }}
                        >
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📋 {st.text}</span>
                          <button
                            onClick={() =>
                              setSubTasksToAdd(subTasksToAdd.filter((s) => s.id !== st.id))
                            }
                            style={{
                              padding: '1px 4px',
                              borderRadius: '4px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            <IconX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={addTask} disabled={taskSaving} className="btn btn-primary" style={{ width: '100%', gap: '6px' }}>
                    <IconPlus /> {taskSaving ? 'Adding...' : 'Add Task'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((t, index) => {
                    const taskSubtasks = subTasks[t.id] || []
                    const completedSubtasks = taskSubtasks.filter((st) => st.done).length
                    const isExpanded = activeTaskId === t.id

                    return (
                      <div
                        key={t.id}
                        className="card"
                        style={{
                          padding: '14px 16px',
                          overflow: 'hidden',
                          border: isExpanded ? '1px solid var(--brand-blue)' : '1px solid var(--glass-border)',
                          transition: 'all 0.2s ease',
                          animation: `slideUp 0.5s var(--spring) both`,
                          animationDelay: `${index * 30}ms`
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer'
                          }}
                          onClick={() => setActiveTaskId(isExpanded ? null : t.id)}
                        >
                          <input
                            type="checkbox"
                            checked={t.done}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleTask(t.id)
                            }}
                            className="custom-checkbox"
                          />

                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: t.done ? 'var(--text-muted)' : 'var(--text-primary)',
                                textDecoration: t.done ? 'line-through' : 'none',
                                letterSpacing: '-0.2px'
                              }}
                            >
                              {t.content}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                              {t.difficulty && (
                                <span
                                  className={`chip ${
                                    t.difficulty === 'hard'
                                      ? 'chip-hard'
                                      : t.difficulty === 'medium'
                                      ? 'chip-medium'
                                      : 'chip-easy'
                                  }`}
                                  style={{ height: '28px', fontSize: '11px' }}
                                >
                                  {t.difficulty}
                                </span>
                              )}
                              {t.estimated_minutes && (
                                <span className="chip chip-minutes" style={{ height: '28px', fontSize: '11px' }}>
                                  {t.estimated_minutes}m
                                </span>
                              )}
                              {t.category_tag && t.category_tag !== 'general' && (
                                <span className="chip chip-tag" style={{ height: '28px', fontSize: '11px' }}>
                                  #{t.category_tag}
                                </span>
                              )}
                              {t.time && (
                                <span
                                  className="chip"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.10)',
                                    color: 'var(--text-muted)',
                                    height: '28px',
                                    fontSize: '11px'
                                  }}
                                >
                                  {t.time}
                                </span>
                              )}
                              {taskSubtasks.length > 0 && (
                                <span
                                  className="chip chip-progress"
                                  style={{ height: '28px', fontSize: '11px' }}
                                >
                                  📋 {completedSubtasks}/{taskSubtasks.length}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                              {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteTask(t.id)
                              }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                              <IconX />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div
                            style={{
                              paddingTop: '12px',
                              marginTop: '12px',
                              borderTop: '1px solid var(--glass-border)',
                              animation: 'fadeIn 0.25s ease'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                              <input
                                value={newSubTask}
                                onChange={(e) => setNewSubTask(e.target.value)}
                                placeholder="Add subtask..."
                                className="input"
                                style={{ flex: 1, fontSize: '13px', padding: '6px 12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addSubTask(t.id)
                                  }
                                }}
                              />
                              <button onClick={() => addSubTask(t.id)} className="btn btn-primary btn-sm">
                                Add
                              </button>
                            </div>
                            {taskSubtasks.length > 0 ? (
                              taskSubtasks.map((st) => (
                                <div
                                  key={st.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '4px 0'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={st.done}
                                    onChange={() => toggleSubTask(t.id, st.id)}
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      accentColor: 'var(--brand-blue)',
                                      cursor: 'pointer'
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: '14px',
                                      color: st.done ? 'var(--text-muted)' : 'var(--text-secondary)',
                                      textDecoration: st.done ? 'line-through' : 'none',
                                      flex: 1
                                    }}
                                  >
                                    {st.text}
                                  </span>
                                  <button
                                    onClick={() => deleteSubTask(t.id, st.id)}
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      border: 'none',
                                      background: 'transparent',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                  >
                                    <IconX />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-center" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                No subtasks yet
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px', opacity: 0.5 }}>🎯</div>
                    <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-secondary)' }}>
                      Nothing scheduled today.
                    </p>
                    <p style={{ fontSize: '14px', marginTop: '4px', color: 'var(--text-tertiary)' }}>
                      Enjoy the calm or add a new challenge.
                    </p>
                    <button
                      onClick={() => {
                        document.querySelector('input[placeholder="Add a task..."]')?.focus()
                      }}
                      className="btn btn-primary"
                      style={{ marginTop: '16px', gap: '6px' }}
                    >
                      <IconPlus /> Add Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== JOURNAL TAB ===== */}
          {activeTab === 'journal' && (
            <div>
              <div className="section-title">Journal</div>
              <div className="section-subtitle">Reflect on your progress.</div>

              <div
                className="glass"
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <span className="tiny-label">Date</span>
                <input
                  type="date"
                  value={journalDateFilter}
                  onChange={(e) => {
                    setJournalDateFilter(e.target.value)
                    fetchJournal()
                  }}
                  className="input"
                  style={{ width: '160px', padding: '6px 12px', fontSize: '12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                />
                {journalDateFilter && (
                  <button
                    onClick={() => {
                      setJournalDateFilter('')
                      fetchJournal()
                    }}
                    className="btn btn-sm btn-danger"
                    style={{ gap: '4px' }}
                  >
                    <IconX size={14} /> Clear
                  </button>
                )}

                <span className="tiny-label" style={{ marginLeft: '8px' }}>
                  Tag
                </span>
                <select
                  value={journalTagFilter}
                  onChange={(e) => setJournalTagFilter(e.target.value)}
                  className="select"
                  style={{ width: '140px', padding: '6px 12px', fontSize: '12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="">All Tags</option>
                  {[...new Set(journalEntries.map((e) => e.tags || '').filter((t) => t.trim()))].map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                {journalTagFilter && (
                  <button
                    onClick={() => setJournalTagFilter('')}
                    className="btn btn-sm btn-danger"
                    style={{ gap: '4px' }}
                  >
                    <IconX size={14} /> Clear
                  </button>
                )}
              </div>

              <div
                className="glass"
                style={{
                  marginBottom: '20px',
                  padding: '16px',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <textarea
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  placeholder="What's on your mind today?"
                  className="textarea"
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '16px',
                    fontSize: '16px',
                    lineHeight: 1.8,
                    background: 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-blur)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '10px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <span className="tiny-label" style={{ display: 'block', marginBottom: '2px' }}>
                      Mood
                    </span>
                    <input
                      value={journalMood}
                      onChange={(e) => setJournalMood(e.target.value)}
                      placeholder="e.g., happy, stressed, calm"
                      className="input"
                      style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 2, minWidth: '180px' }}>
                    <span className="tiny-label" style={{ display: 'block', marginBottom: '2px' }}>
                      Tags (comma separated)
                    </span>
                    <input
                      value={journalTags}
                      onChange={(e) => setJournalTags(e.target.value)}
                      placeholder="e.g., work, personal, ideas"
                      className="input"
                      style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
                    />
                  </div>
                  <button
                    onClick={saveJournal}
                    disabled={journalSaving}
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-end', marginTop: '8px', minWidth: '100px', gap: '6px' }}
                  >
                    <IconSave /> {journalSaving ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </div>

              {journalEntries.length > 0 ? (
                (() => {
                  const groups = {}
                  journalEntries.forEach((entry) => {
                    const group = formatEntryDate(entry.created_at)
                    if (!groups[group]) groups[group] = []
                    groups[group].push(entry)
                  })

                  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier']

                  return groupOrder.map((group) => {
                    if (!groups[group] || groups[group].length === 0) return null
                    return (
                      <div key={group} style={{ marginBottom: '16px' }}>
                        <div
                          className="tiny-label"
                          style={{
                            marginBottom: '8px',
                            color: 'var(--text-secondary)',
                            fontSize: '13px',
                            fontWeight: 600
                          }}
                        >
                          {group}
                        </div>
                        {groups[group]
                          .filter((entry) => {
                            if (!journalTagFilter) return true
                            const tags = (entry.tags || '').split(',').map((t) => t.trim())
                            return tags.includes(journalTagFilter)
                          })
                          .map((entry, index) => {
                            const isExpanded = expandedEntries[entry.id] || false
                            const previewLength = 120

                            return (
                              <div
                                key={entry.id}
                                className="card"
                                style={{
                                  padding: '16px',
                                  marginBottom: '10px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  animation: `slideUp 0.5s var(--spring) both`,
                                  animationDelay: `${index * 30}ms`
                                }}
                                onClick={() =>
                                  setExpandedEntries((prev) => ({
                                    ...prev,
                                    [entry.id]: !prev[entry.id]
                                  }))
                                }
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '6px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span className="caption" style={{ fontSize: '12px' }}>
                                      {new Date(entry.created_at).toLocaleString()}
                                    </span>
                                    {entry.mood && (
                                      <span
                                        className="chip chip-tag"
                                        style={{
                                          height: '24px',
                                          fontSize: '10px',
                                          padding: '0 10px',
                                          background: 'rgba(79, 140, 255, 0.10)',
                                          color: 'var(--brand-blue)'
                                        }}
                                      >
                                        {entry.mood}
                                      </span>
                                    )}
                                    {entry.tags &&
                                      entry.tags
                                        .split(',')
                                        .map((t) => t.trim())
                                        .filter(Boolean)
                                        .map((tag) => (
                                          <span
                                            key={tag}
                                            className="chip chip-tag"
                                            style={{ height: '24px', fontSize: '10px', padding: '0 10px' }}
                                          >
                                            #{tag}
                                          </span>
                                        ))}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm('Delete this entry?')) deleteJournalEntry(entry.id)
                                    }}
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: 'transparent',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                  >
                                    <IconX />
                                  </button>
                                </div>

                                <div
                                  style={{
                                    fontSize: '15px',
                                    lineHeight: 1.8,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    maxWidth: '70ch'
                                  }}
                                >
                                  {isExpanded
                                    ? entry.content
                                    : entry.content.length > previewLength
                                    ? entry.content.slice(0, previewLength) + '...'
                                    : entry.content}
                                </div>

                                {entry.content.length > previewLength && (
                                  <div style={{ marginTop: '8px' }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setExpandedEntries((prev) => ({
                                          ...prev,
                                          [entry.id]: !prev[entry.id]
                                        }))
                                      }}
                                      className="btn btn-ghost btn-sm"
                                      style={{
                                        padding: '2px 12px',
                                        fontSize: '12px',
                                        height: '28px',
                                        borderRadius: '999px'
                                      }}
                                    >
                                      {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
                                      {isExpanded ? ' Show less' : ' Read more'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    )
                  })
                })()
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px', opacity: 0.5 }}>📖</div>
                  <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-secondary)' }}>
                    No journal entries yet.
                  </p>
                  <p style={{ fontSize: '14px', marginTop: '4px', color: 'var(--text-tertiary)' }}>
                    Write your first entry above.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== STATS MODAL ===== */}
        {showStatsModal && (
          <div className="stats-modal-overlay" onClick={() => setShowStatsModal(false)}>
            <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
              <div className="stats-modal-header">
                <div className="stats-modal-title">Full Stats Dashboard</div>
                <button className="stats-modal-close" onClick={() => setShowStatsModal(false)}>
                  <IconX size={20} />
                </button>
              </div>

              <div className="stats-modal-content">

                {/* 1. Discipline Overview */}
                <div className="stats-section">
                  <div className="stats-section-title">Discipline Overview</div>
                  <div className="stats-section-divider" />
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                    gap: '16px' 
                  }}>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: 'var(--brand-blue)' }}>
                        {statsData.disciplineScore}/100
                      </div>
                      <div className="stat-label">Discipline Score</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ 
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '20px'
                      }}>
                        {statsData.disciplineBadge} {statsData.disciplineLevel}
                      </div>
                      <div className="stat-label">Level</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: '#F59E0B' }}>{streak}</div>
                      <div className="stat-label">Current Streak</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: 'var(--brand-purple)' }}>{statsData.longestStreak}</div>
                      <div className="stat-label">Longest Streak</div>
                    </div>
                  </div>
                </div>

                {/* 2. Weekly Breakdown */}
                <div className="stats-section">
                  <div className="stats-section-title">Weekly Breakdown</div>
                  <div className="stats-section-divider" />
                  {statsData.weeklyBreakdown.map((day, index) => (
                    <div key={index} className="weekly-bar">
                      <span className="weekly-bar-label">{day.day}</span>
                      <div className="weekly-bar-track">
                        <div 
                          className="weekly-bar-fill" 
                          style={{ 
                            width: `${day.percent}%`,
                            background: day.percent >= 80 
                              ? 'var(--gradient-primary)' 
                              : day.percent >= 50 
                                ? 'linear-gradient(90deg, #F59E0B, #F97316)'
                                : 'linear-gradient(90deg, #EF4444, #DC2626)'
                          }}
                        />
                      </div>
                      <span className="weekly-bar-percent">{day.percent}%</span>
                    </div>
                  ))}
                </div>

                {/* 3. Habit Tracker Rings */}
                <div className="stats-section">
                  <div className="stats-section-title">Habit Tracker</div>
                  <div className="stats-section-divider" />
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                    gap: '16px',
                    justifyContent: 'center'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="habit-ring" style={{ margin: '0 auto' }}>
                        <svg width="70" height="70" viewBox="0 0 70 70">
                          <circle cx="35" cy="35" r="30" className="habit-ring-circle habit-ring-bg" />
                          <circle 
                            cx="35" 
                            cy="35" 
                            r="30" 
                            className="habit-ring-circle habit-ring-progress"
                            style={{
                              strokeDashoffset: 188.5 * (1 - (statsData.dailyHabitsTotal > 0 
                                ? statsData.dailyHabitsDone / statsData.dailyHabitsTotal 
                                : 0))
                            }}
                          />
                        </svg>
                        <div className="habit-ring-label">
                          <div className="habit-ring-value">
                            {statsData.dailyHabitsTotal > 0 
                              ? Math.round((statsData.dailyHabitsDone / statsData.dailyHabitsTotal) * 100)
                              : 0}%
                          </div>
                          Daily
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div className="habit-ring" style={{ margin: '0 auto' }}>
                        <svg width="70" height="70" viewBox="0 0 70 70">
                          <circle cx="35" cy="35" r="30" className="habit-ring-circle habit-ring-bg" />
                          <circle 
                            cx="35" 
                            cy="35" 
                            r="30" 
                            className="habit-ring-circle habit-ring-progress"
                            style={{
                              strokeDashoffset: 188.5 * (1 - (statsData.weeklyHabitsTotal > 0 
                                ? statsData.weeklyHabitsDone / statsData.weeklyHabitsTotal 
                                : 0))
                            }}
                          />
                        </svg>
                        <div className="habit-ring-label">
                          <div className="habit-ring-value">
                            {statsData.weeklyHabitsTotal > 0 
                              ? Math.round((statsData.weeklyHabitsDone / statsData.weeklyHabitsTotal) * 100)
                              : 0}%
                          </div>
                          Weekly
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div className="habit-ring" style={{ margin: '0 auto' }}>
                        <svg width="70" height="70" viewBox="0 0 70 70">
                          <circle cx="35" cy="35" r="30" className="habit-ring-circle habit-ring-bg" />
                          <circle 
                            cx="35" 
                            cy="35" 
                            r="30" 
                            className="habit-ring-circle habit-ring-progress"
                            style={{
                              strokeDashoffset: 188.5 * (1 - (statsData.monthlyHabitsTotal > 0 
                                ? statsData.monthlyHabitsDone / statsData.monthlyHabitsTotal 
                                : 0))
                            }}
                          />
                        </svg>
                        <div className="habit-ring-label">
                          <div className="habit-ring-value">
                            {statsData.monthlyHabitsTotal > 0 
                              ? Math.round((statsData.monthlyHabitsDone / statsData.monthlyHabitsTotal) * 100)
                              : 0}%
                          </div>
                          Monthly
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Focus Analysis */}
                <div className="stats-section">
                  <div className="stats-section-title">Focus Analysis</div>
                  <div className="stats-section-divider" />
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                    gap: '12px' 
                  }}>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: 'var(--brand-blue)' }}>
                        {formatMinutes(statsData.todayFocus)}
                      </div>
                      <div className="stat-label">Today</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: '#22C55E' }}>
                        {formatMinutes(statsData.weekFocus)}
                      </div>
                      <div className="stat-label">This Week</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: 'var(--brand-purple)' }}>
                        {formatMinutes(statsData.monthFocus)}
                      </div>
                      <div className="stat-label">This Month</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: '#F59E0B' }}>
                        {formatMinutes(statsData.avgFocusPerDay)}
                      </div>
                      <div className="stat-label">Avg / Day</div>
                    </div>
                    {statsData.bestFocusDay && (
                      <div className="stat-item">
                        <div className="stat-value" style={{ color: '#F97316', fontSize: '18px' }}>
                          {formatMinutes(statsData.bestFocusMinutes)}
                        </div>
                        <div className="stat-label">Best: {statsData.bestFocusDay}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Additional Metrics */}
                <div className="stats-section">
                  <div className="stats-section-title">Additional Metrics</div>
                  <div className="stats-section-divider" />
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                    gap: '12px' 
                  }}>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: '#22C55E' }}>
                        {statsData.commitmentRate}%
                      </div>
                      <div className="stat-label">Commitment Rate</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: 'var(--brand-blue)' }}>
                        {statsData.monthlyProgress}%
                      </div>
                      <div className="stat-label">Monthly Progress</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: 'var(--brand-purple)' }}>
                        {statsData.habitCompletion}%
                      </div>
                      <div className="stat-label">Habit Completion</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: '#F59E0B' }}>
                        {statsData.taskVelocity}
                      </div>
                      <div className="stat-label">Tasks / Hour</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: '#22C55E' }}>
                        {statsData.dailyAverage}
                      </div>
                      <div className="stat-label">Daily Avg (30d)</div>
                    </div>
                    {statsData.bestDay && (
                      <div className="stat-item">
                        <div className="stat-value" style={{ color: '#F97316', fontSize: '18px' }}>
                          {statsData.bestDayCount}
                        </div>
                        <div className="stat-label">Best Day: {statsData.bestDay}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Streak Protection */}
                {statsData.streakEndangered && (
                  <div className="stats-section">
                    <div style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(239, 68, 68, 0.06)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <IconAlertTriangle size={24} color="var(--text-muted)" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                          You're {statsData.daysUntilStreakLoss} day{statsData.daysUntilStreakLoss > 1 ? 's' : ''} from losing your {streak}-day streak!
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                          {statsData.nextMilestone > 0 && `Complete today to reach ${statsData.nextMilestone} days!`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. Milestone */}
                {statsData.nextMilestone > 0 && streak > 0 && (
                  <div className="stats-section">
                    <div style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(34, 197, 94, 0.06)',
                      border: '1px solid rgba(34, 197, 94, 0.15)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Next Milestone: <strong style={{ color: '#22C55E' }}>{statsData.nextMilestone} days</strong>
                        <span style={{ marginLeft: '12px', color: 'var(--text-tertiary)' }}>
                          ({statsData.nextMilestone - streak} days to go!)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. Export */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '12px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--glass-border)'
                }}>
                  <button
                    onClick={() => {
                      exportStatsReport()
                      setShowStatsModal(false)
                    }}
                    className="btn btn-primary"
                    style={{ gap: '6px' }}
                  >
                    <IconTrophy size={16} /> Export Stats Report
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ===== TOAST ===== */}
        {toast.show && (
          <div className={`toast show ${toast.type}`}>
            {toast.message}
            {toast.undo && (
              <span className="undo" onClick={toast.undo}>
                Undo
              </span>
            )}
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes slideUp {
            0% { opacity: 0; transform: translateY(20px) translateZ(0); }
            100% { opacity: 1; transform: translateY(0) translateZ(0); }
          }
          @keyframes slideDown {
            0% { opacity: 0; transform: translateY(-10px) translateZ(0); }
            100% { opacity: 1; transform: translateY(0) translateZ(0); }
          }
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .fade-in { animation: fadeIn 0.4s var(--ease-out) forwards; }
          .slide-up { animation: slideUp 0.5s var(--spring) forwards; }
        `}</style>
      </div>
    </>
  )
}
