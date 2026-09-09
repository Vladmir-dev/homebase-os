/**
 * TruHub OS — Design Token Palette
 *
 * Blue  #2563EB — primary, trust, technology, reliability
 * Teal  #0D9488 — home, growth, services, progress
 * Accent #F59E0B — warnings, highlights, important actions, price alerts
 * Green #22C55E — completed, verified, successful payments, approved
 * Charcoal #1E293B — primary text
 * Slate  #64748B — secondary/muted text
 */

const TruHub = {
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueLight: '#DBEAFE',
  blueMuted: 'rgba(37, 99, 235, 0.08)',

  teal: '#0D9488',
  tealDark: '#0F766E',
  tealLight: '#CCFBF1',
  tealMuted: 'rgba(13, 148, 136, 0.08)',

  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: '#FEF3C7',

  green: '#22C55E',
  greenDark: '#16A34A',
  greenLight: '#DCFCE7',

  red: '#EF4444',
  redDark: '#DC2626',
  redLight: '#FEE2E2',

  charcoal: '#1E293B',
  slate: '#64748B',
  slateLight: '#94A3B8',

  white: '#FFFFFF',
  bg: '#F8FAFC',
  cardBg: 'rgba(255, 255, 255, 0.92)',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  divider: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export default {
  light: {
    text: TruHub.charcoal,
    muted: TruHub.slate,
    background: TruHub.bg,
    tint: TruHub.blue,
    tabIconDefault: '#CBD5E1',
    tabIconSelected: TruHub.blue,
  },
  dark: {
    text: '#F1F5F9',
    muted: '#94A3B8',
    background: '#0F172A',
    tint: TruHub.blue,
    tabIconDefault: '#475569',
    tabIconSelected: TruHub.blue,
  },
  TruHub,
};
