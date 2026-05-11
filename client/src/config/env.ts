function normalizeUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export const env = {
  socketUrl:
    import.meta.env.VITE_SOCKET_URL ??
    `${window.location.protocol}//${window.location.hostname}:4000`,
  publicAppUrl: import.meta.env.VITE_PUBLIC_APP_URL ? normalizeUrl(import.meta.env.VITE_PUBLIC_APP_URL) : '',
};
