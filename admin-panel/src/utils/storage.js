const storage = {
  getItem: (key) => {
    try { return Promise.resolve(localStorage.getItem(key)); }
    catch { return Promise.resolve(null); }
  },
  setItem: (key, value) => {
    try { localStorage.setItem(key, value); return Promise.resolve(); }
    catch { return Promise.resolve(); }
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key); return Promise.resolve(); }
    catch { return Promise.resolve(); }
  },
  multiSet: (pairs) => {
    try { pairs.forEach(([k, v]) => localStorage.setItem(k, v)); return Promise.resolve(); }
    catch { return Promise.resolve(); }
  },
  multiRemove: (keys) => {
    try { keys.forEach(k => localStorage.removeItem(k)); return Promise.resolve(); }
    catch { return Promise.resolve(); }
  },
};

export default storage;
