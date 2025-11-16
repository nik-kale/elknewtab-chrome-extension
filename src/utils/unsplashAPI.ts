/**
 * Unsplash API integration for background images
 */

export interface UnsplashImage {
  id: string;
  url: string;
  thumbnail: string;
  author: string;
  authorUrl: string;
  downloadLocation: string;
  description?: string;
}

const UNSPLASH_API_URL = 'https://api.unsplash.com';
const DEFAULT_ACCESS_KEY = 'demo'; // Users should provide their own key

/**
 * Fetch random background images from Unsplash
 */
export async function fetchRandomImages(
  count: number = 12,
  query?: string,
  accessKey?: string
): Promise<UnsplashImage[]> {
  try {
    const key = accessKey || DEFAULT_ACCESS_KEY;
    const params = new URLSearchParams({
      client_id: key,
      count: count.toString(),
      orientation: 'landscape'
    });

    if (query) {
      params.append('query', query);
    }

    const url = `${UNSPLASH_API_URL}/photos/random?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch images from Unsplash');
    }

    const data = await response.json();
    const images = Array.isArray(data) ? data : [data];

    return images.map((img: any) => ({
      id: img.id,
      url: img.urls.regular,
      thumbnail: img.urls.thumb,
      author: img.user.name,
      authorUrl: img.user.links.html,
      downloadLocation: img.links.download_location,
      description: img.description || img.alt_description
    }));
  } catch (error) {
    console.error('Error fetching Unsplash images:', error);
    return [];
  }
}

/**
 * Search for images on Unsplash
 */
export async function searchImages(
  query: string,
  page: number = 1,
  perPage: number = 12,
  accessKey?: string
): Promise<UnsplashImage[]> {
  try {
    const key = accessKey || DEFAULT_ACCESS_KEY;
    const params = new URLSearchParams({
      client_id: key,
      query,
      page: page.toString(),
      per_page: perPage.toString(),
      orientation: 'landscape'
    });

    const url = `${UNSPLASH_API_URL}/search/photos?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to search images on Unsplash');
    }

    const data = await response.json();

    return data.results.map((img: any) => ({
      id: img.id,
      url: img.urls.regular,
      thumbnail: img.urls.thumb,
      author: img.user.name,
      authorUrl: img.user.links.html,
      downloadLocation: img.links.download_location,
      description: img.description || img.alt_description
    }));
  } catch (error) {
    console.error('Error searching Unsplash images:', error);
    return [];
  }
}

/**
 * Download an image and convert to base64
 */
export async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

/**
 * Trigger download tracking (required by Unsplash API guidelines)
 */
export async function triggerDownload(
  downloadLocation: string,
  accessKey?: string
): Promise<void> {
  try {
    const key = accessKey || DEFAULT_ACCESS_KEY;
    await fetch(`${downloadLocation}?client_id=${key}`);
  } catch (error) {
    console.error('Error triggering download:', error);
  }
}

/**
 * Get curated collections
 */
export async function getCuratedCollections(accessKey?: string): Promise<any[]> {
  try {
    const key = accessKey || DEFAULT_ACCESS_KEY;
    const url = `${UNSPLASH_API_URL}/collections/featured?client_id=${key}&per_page=10`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch collections');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}
