export const getGoogleMapsConfig = (apiKey?: string) => ({
  apiKey: apiKey || '',
  defaultCenter: {
    latitude: -12.0464,
    longitude: -77.0428,
  },
  defaultZoom: 13,
});