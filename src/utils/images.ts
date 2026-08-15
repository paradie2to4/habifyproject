/** Reliable fallback when remote listing photos fail to load. */
export const PROPERTY_IMAGE_FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a2942"/>
      <stop offset="55%" stop-color="#2d4182"/>
      <stop offset="100%" stop-color="#d46251"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#g)"/>
  <text x="400" y="250" text-anchor="middle" fill="#faf8f5" font-family="Georgia, serif" font-size="28" opacity="0.9">Habify</text>
  <text x="400" y="285" text-anchor="middle" fill="#e0d5c7" font-family="system-ui,sans-serif" font-size="14">Photo unavailable</text>
</svg>`.trim());

const PLACEHOLDER_POOL = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
];

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** Normalize image lists from seed data, localStorage, or backend CSV strings. */
export function normalizeImageList(images: unknown, seedKey = ''): string[] {
  let list: string[] = [];

  if (Array.isArray(images)) {
    list = images.map(String);
  } else if (typeof images === 'string' && images.trim()) {
    // Backend stores comma-separated URLs; don't split on query commas incorrectly —
    // Unsplash URLs use & not commas in query strings.
    list = images.split(',').map(s => s.trim());
  }

  list = list.map(s => s.trim()).filter(isHttpUrl);

  if (list.length === 0) {
    const idx = Math.abs(hashString(seedKey)) % PLACEHOLDER_POOL.length;
    return [PLACEHOLDER_POOL[idx]];
  }

  return list;
}

export function resolvePropertyImage(
  images: unknown,
  index = 0,
  seedKey = ''
): string {
  const list = normalizeImageList(images, seedKey);
  return list[Math.min(index, list.length - 1)] || PROPERTY_IMAGE_FALLBACK;
}

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return h;
}
