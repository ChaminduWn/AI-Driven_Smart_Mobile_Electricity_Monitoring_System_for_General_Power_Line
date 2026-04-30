export const MEMBER1_API_BASE =
  import.meta.env.VITE_MEMBER1_API_BASE ?? 'http://localhost:8000/api/v1';

export const MEMBER3_API_BASE =
  import.meta.env.VITE_MEMBER3_API_BASE ?? 'http://localhost:5000';

export const MEMBER4_API_BASE =
  import.meta.env.VITE_MEMBER4_API_BASE ?? 'http://localhost:8001';

export function joinUrl(base, path) {
  const b = String(base ?? '').replace(/\/+$/, '');
  const p = String(path ?? '').replace(/^\/+/, '');
  return `${b}/${p}`;
}

