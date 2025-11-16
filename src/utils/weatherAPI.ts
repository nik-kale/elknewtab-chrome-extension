/**
 * Weather API integration using OpenWeatherMap
 */

export interface WeatherData {
  temp: string;
  location: string;
  condition: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
  feelsLike?: string;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}

// Note: For production, users should add their own API key in settings
// This is a demo key with limited requests
const DEFAULT_API_KEY = 'demo';

/**
 * Get user's geolocation
 */
async function getGeolocation(): Promise<GeoLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        resolve(null);
      },
      {
        timeout: 5000,
        enableHighAccuracy: false
      }
    );
  });
}

/**
 * Get weather icon emoji based on condition code
 */
function getWeatherIcon(conditionCode: number, isDay: boolean = true): string {
  // OpenWeatherMap condition codes
  if (conditionCode >= 200 && conditionCode < 300) return '⛈️'; // Thunderstorm
  if (conditionCode >= 300 && conditionCode < 400) return '🌧️'; // Drizzle
  if (conditionCode >= 500 && conditionCode < 600) return '🌧️'; // Rain
  if (conditionCode >= 600 && conditionCode < 700) return '❄️'; // Snow
  if (conditionCode >= 700 && conditionCode < 800) return '🌫️'; // Atmosphere (fog, mist, etc.)
  if (conditionCode === 800) return isDay ? '☀️' : '🌙'; // Clear
  if (conditionCode > 800) return '☁️'; // Clouds

  return '🌤️'; // Default
}

/**
 * Fetch weather data from OpenWeatherMap API
 */
export async function fetchWeatherData(apiKey?: string): Promise<WeatherData | null> {
  try {
    const key = apiKey || DEFAULT_API_KEY;

    // Get user's location first
    const location = await getGeolocation();

    if (!location) {
      // Fallback to IP-based location or default
      return await fetchWeatherByCity('New York', key);
    }

    const { latitude, longitude } = location;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${key}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();

    return {
      temp: `${Math.round(data.main.temp)}°`,
      location: `${data.name}, ${data.sys.country}`,
      condition: data.weather[0].main,
      icon: getWeatherIcon(data.weather[0].id, data.weather[0].icon.includes('d')),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      feelsLike: `${Math.round(data.main.feels_like)}°`
    };
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    return null;
  }
}

/**
 * Fetch weather by city name
 */
export async function fetchWeatherByCity(city: string, apiKey?: string): Promise<WeatherData | null> {
  try {
    const key = apiKey || DEFAULT_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=imperial&appid=${key}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();

    return {
      temp: `${Math.round(data.main.temp)}°`,
      location: `${data.name}, ${data.sys.country}`,
      condition: data.weather[0].main,
      icon: getWeatherIcon(data.weather[0].id, data.weather[0].icon.includes('d')),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      feelsLike: `${Math.round(data.main.feels_like)}°`
    };
  } catch (error) {
    console.error('Failed to fetch weather by city:', error);
    return null;
  }
}

/**
 * Cache weather data to avoid excessive API calls
 */
const CACHE_KEY = 'weatherCache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function getCachedWeatherData(apiKey?: string): Promise<WeatherData | null> {
  try {
    // Check cache first
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    // Fetch fresh data
    const weatherData = await fetchWeatherData(apiKey);

    if (weatherData) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: weatherData,
        timestamp: Date.now()
      }));
    }

    return weatherData;
  } catch (error) {
    console.error('Error getting cached weather:', error);
    return null;
  }
}
