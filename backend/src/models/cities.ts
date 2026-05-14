// Cities supported by the app. To add a city: append to this array.
// Validation against this list is exact, case-insensitive.
export const SUPPORTED_CITIES = ['Chennai'] as const;
export type SupportedCity = (typeof SUPPORTED_CITIES)[number];

export function isSupportedCity(city: string): boolean {
  return SUPPORTED_CITIES.some((c) => c.toLowerCase() === city.trim().toLowerCase());
}
