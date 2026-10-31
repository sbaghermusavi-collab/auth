export const THEME_PALETTES = [
  {
    id: 'terracotta',
    name: 'سفال اخرایی و اسپرسو',
    subtitle: 'Terracotta & Warm Espresso',
    primaryHex: '#bf431d',
    secondaryHex: '#0f766e',
    sidebarHex: '#1b1512',
    canvasHex: '#f4efe6'
  },
  {
    id: 'emerald',
    name: 'زمرد پارسی و کهربا',
    subtitle: 'Persian Emerald & Gold',
    primaryHex: '#0b6457',
    secondaryHex: '#b45309',
    sidebarHex: '#101d19',
    canvasHex: '#eef3f0'
  },
  {
    id: 'bordeaux',
    name: 'یاقوت عنابی و شنی',
    subtitle: 'Royal Pomegranate & Sand',
    primaryHex: '#9b1c3e',
    secondaryHex: '#0f766e',
    sidebarHex: '#1e1216',
    canvasHex: '#f6f0ee'
  },
  {
    id: 'bronze',
    name: 'برنز کهربایی و زغالی',
    subtitle: 'Antique Bronze & Obsidian',
    primaryHex: '#a84b08',
    secondaryHex: '#0f766e',
    sidebarHex: '#171513',
    canvasHex: '#f5f1e7'
  }
];

const STORAGE_KEY = 'asan_admin_color_palette';

export function getSavedPalette() {
  if (typeof window === 'undefined') return 'terracotta';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && THEME_PALETTES.some((p) => p.id === saved)) {
    return saved;
  }
  return 'terracotta';
}

export function applyThemePalette(paletteId) {
  const validId = THEME_PALETTES.some((p) => p.id === paletteId) ? paletteId : 'terracotta';
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, validId);
    document.documentElement.setAttribute('data-theme', validId);
  }
  return validId;
}
