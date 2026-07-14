export const GARMENT_COLORS = [
  'Black',
  'White',
  'Red',
  'Blue',
  'Navy Blue',
  'Sky Blue',
  'Royal Blue',
  'Green',
  'Olive Green',
  'Yellow',
  'Orange',
  'Purple',
  'Pink',
  'Brown',
  'Grey',
  'Dark Grey',
  'Light Grey',
  'Maroon',
  'Beige',
  'Cream',
  'Khaki',
  'Gold',
  'Silver',
]

const COLOR_HEX: Record<string, string> = {
  'Black': '#000000',
  'White': '#ffffff',
  'Red': '#dc2626',
  'Blue': '#2563eb',
  'Navy Blue': '#1e3a5f',
  'Sky Blue': '#87ceeb',
  'Royal Blue': '#4169e1',
  'Green': '#16a34a',
  'Olive Green': '#556b2f',
  'Yellow': '#eab308',
  'Orange': '#ea580c',
  'Purple': '#9333ea',
  'Pink': '#ec4899',
  'Brown': '#78350f',
  'Grey': '#6b7280',
  'Dark Grey': '#374151',
  'Light Grey': '#d1d5db',
  'Maroon': '#800000',
  'Beige': '#e8d5b7',
  'Cream': '#fef3c7',
  'Khaki': '#c3b091',
  'Gold': '#d4a017',
  'Silver': '#a8a8a8',
}

export function getColorHex(name: string): string {
  return COLOR_HEX[name] || '#cccccc'
}

export function isValidColor(name: string): boolean {
  return GARMENT_COLORS.includes(name)
}
