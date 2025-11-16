/**
 * Search engine configurations
 */

export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  placeholder: string;
  icon?: string;
}

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    placeholder: 'Search Google...',
    icon: '🔍'
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    placeholder: 'Search DuckDuckGo...',
    icon: '🦆'
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    placeholder: 'Search Bing...',
    icon: '🅱️'
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    url: 'https://search.yahoo.com/search?p=',
    placeholder: 'Search Yahoo...',
    icon: '🟣'
  },
  {
    id: 'brave',
    name: 'Brave',
    url: 'https://search.brave.com/search?q=',
    placeholder: 'Search Brave...',
    icon: '🦁'
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    url: 'https://www.ecosia.org/search?q=',
    placeholder: 'Search Ecosia...',
    icon: '🌳'
  }
];

export function getSearchEngine(id: string): SearchEngine {
  return SEARCH_ENGINES.find(engine => engine.id === id) || SEARCH_ENGINES[0];
}

export function performSearch(query: string, engineId: string): void {
  const engine = getSearchEngine(engineId);
  window.location.href = engine.url + encodeURIComponent(query);
}
