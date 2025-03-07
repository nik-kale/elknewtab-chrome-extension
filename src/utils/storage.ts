// Create a localStorage-based fallback for chrome.storage.sync
const localStorageSync = {
  get: (keys: string | string[] | Object, callback: Function) => {
    console.log('LocalStorage fallback: get', keys);
    const result: Record<string, any> = {};

    if (typeof keys === 'string') {
      const value = localStorage.getItem(keys);
      if (value) result[keys] = JSON.parse(value);
    } else if (Array.isArray(keys)) {
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) result[key] = JSON.parse(value);
      });
    } else {
      Object.keys(keys).forEach(key => {
        const value = localStorage.getItem(key);
        result[key] = value ? JSON.parse(value) : (keys as Record<string, any>)[key];
      });
    }

    console.log('LocalStorage fallback: get result', result);
    callback(result);
  },
  set: (items: Record<string, any>, callback?: Function) => {
    console.log('LocalStorage fallback: set', items);
    Object.keys(items).forEach(key => {
      localStorage.setItem(key, JSON.stringify(items[key]));
    });

    if (callback) callback();
  },
  // Add remove method for completeness
  remove: (keys: string | string[], callback?: Function) => {
    console.log('LocalStorage fallback: remove', keys);
    if (typeof keys === 'string') {
      localStorage.removeItem(keys);
    } else if (Array.isArray(keys)) {
      keys.forEach(key => localStorage.removeItem(key));
    }

    if (callback) callback();
  },
  // Add clear method for completeness
  clear: (callback?: Function) => {
    console.log('LocalStorage fallback: clear');
    localStorage.clear();
    if (callback) callback();
  }
};

// Create a wrapper for chrome.storage to add debugging
const createChromeStorageWrapper = (storage: any) => {
  return {
    get: (keys: string | string[] | Object, callback: Function) => {
      console.log('Chrome storage: get', keys);
      storage.get(keys, (result: any) => {
        console.log('Chrome storage: get result', result);
        callback(result);
      });
    },
    set: (items: Record<string, any>, callback?: Function) => {
      console.log('Chrome storage: set', items);
      storage.set(items, () => {
        if (chrome.runtime.lastError) {
          console.error('Chrome storage error:', chrome.runtime.lastError);
        } else {
          console.log('Chrome storage: set success');
        }
        if (callback) callback();
      });
    },
    remove: (keys: string | string[], callback?: Function) => {
      console.log('Chrome storage: remove', keys);
      storage.remove(keys, () => {
        if (chrome.runtime.lastError) {
          console.error('Chrome storage error:', chrome.runtime.lastError);
        } else {
          console.log('Chrome storage: remove success');
        }
        if (callback) callback();
      });
    },
    clear: (callback?: Function) => {
      console.log('Chrome storage: clear');
      storage.clear(() => {
        if (chrome.runtime.lastError) {
          console.error('Chrome storage error:', chrome.runtime.lastError);
        } else {
          console.log('Chrome storage: clear success');
        }
        if (callback) callback();
      });
    }
  };
};

// Use the real chrome.storage if it exists, otherwise use localStorage
const storage = typeof chrome !== 'undefined' && chrome.storage
  ? { sync: createChromeStorageWrapper(chrome.storage.sync) }
  : { sync: localStorageSync };

export default storage;