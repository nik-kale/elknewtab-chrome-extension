/**
 * Favicon fetcher utility for quick links
 */

const FAVICON_SERVICES = [
  (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  (domain: string) => `https://favicons.githubusercontent.com/${domain}`,
  (domain: string) => `https://${domain}/favicon.ico`,
];

/**
 * Extract domain from URL
 */
function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Fetch favicon for a URL
 */
export async function fetchFavicon(url: string): Promise<string | null> {
  const domain = getDomainFromUrl(url);

  if (!domain) {
    return null;
  }

  // Try each service until one works
  for (const service of FAVICON_SERVICES) {
    try {
      const faviconUrl = service(domain);
      const response = await fetch(faviconUrl);

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch {
      // Try next service
      continue;
    }
  }

  return null;
}

/**
 * Fetch favicons for multiple URLs in parallel
 */
export async function fetchFavicons(urls: string[]): Promise<Map<string, string | null>> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const favicon = await fetchFavicon(url);
      return [url, favicon] as [string, string | null];
    })
  );

  return new Map(results);
}
