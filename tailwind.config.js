const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

const buildCustomSpacingScale = () => {
  const spacing = {};
  for (let i = 1; i <= 800; i++) {
    spacing[i] = `${i * 0.0625}rem`;
  }
  return spacing;
};

const buildCustomLineHeightClasses = () => {
  const lineHeight = {};
  for (let i = 1; i <= 50; i++) {
    lineHeight[`.lh-${i}`] = {
      'line-height': `${i * 0.0625}rem`,
    };
  }
  return lineHeight;
};

const buildCustomFontWeightScale = () => {
  const fontWeight = {};
  for (let i = 1; i <= 9; i++) {
    fontWeight[`.fw-${i}`] = {
      'font-weight': `${i * 100}`,
    };
  }
  return fontWeight;
};

const buildCustomFontSizeClasses = () => {
  const fontSize = {};
  for (let i = 1; i <= 50; i++) {
    fontSize[`.fs-${i}`] = {
      'font-size': `${i * 0.0625}rem`,
    };
  }
  return fontSize;
};

const buildCustomBorderRadiusClasses = () => {
  const borderRadius = {};
  for (let i = 1; i <= 50; i++) {
    borderRadius[`.br-${i}`] = {
      'border-radius': `${i * 0.0625}rem`,
    };
  }
  return borderRadius;
};

const buildCustomBorderBottomRightLeftClasses = () => {
  const borderBottomRightLeft = {};
  for (let i = 1; i <= 50; i++) {
    borderBottomRightLeft[`.bblr-${i}`] = {
      'border-bottom-left-radius': `${i * 0.0625}rem`,
      'border-bottom-right-radius': `${i * 0.0625}rem`,
    };
  }
  return borderBottomRightLeft;
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'), ...createGlobPatternsForDependencies(__dirname)],
  theme: {
    colors: {
      white: '#ffffff',
      black: '#000000',
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      red: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
      orange: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
      },
      yellow: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },
      green: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
      },
      teal: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
      },
      cyan: {
        50: '#ecfeff',
        100: '#cffafe',
        200: '#a5f3fc',
        300: '#67e8f9',
        400: '#22d3ee',
        500: '#06b6d4',
        600: '#0891b2',
        700: '#0e7490',
        800: '#155e75',
        900: '#164e63',
      },
      'light-blue': {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      indigo: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
      },
      purple: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
      },
      pink: {
        50: '#fdf2f8',
        100: '#fce7f3',
        200: '#fbcfe8',
        300: '#f9a8d4',
        400: '#f472b6',
        500: '#ec4899',
        600: '#db2777',
        700: '#be185d',
        800: '#9d174d',
        900: '#831843',
      },
      rose: {
        50: '#fff1f2',
        100: '#ffe4e6',
        200: '#fecdd3',
        300: '#fda4af',
        400: '#fb7185',
        500: '#f43f5e',
        600: '#e11d48',
        700: '#be123c',
        800: '#9f1239',
        900: '#881337',
      },
    },
    extend: {
      spacing: buildCustomSpacingScale(),
      fontWeight: {
        1: '100',
        2: '200',
        3: '300',
        4: '400',
        5: '500',
        6: '600',
        7: '700',
        8: '800',
        9: '900',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ...buildCustomFontWeightScale(),
        ...buildCustomLineHeightClasses(),
        ...buildCustomBorderRadiusClasses(),
        ...buildCustomFontSizeClasses(),
        ...buildCustomBorderBottomRightLeftClasses(),
      });
    },
  ],
};
