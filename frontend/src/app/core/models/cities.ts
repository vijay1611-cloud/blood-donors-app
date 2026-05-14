// Cities supported by the app. To add a city: append to this array
// and redeploy. Keep in sync with backend/src/models/cities.ts.
export const SUPPORTED_CITIES = ['Chennai'] as const;
export type SupportedCity = (typeof SUPPORTED_CITIES)[number];
export const DEFAULT_CITY: SupportedCity = 'Chennai';
