function normalizeUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export const env = {
  socketUrl:
    import.meta.env.VITE_SOCKET_URL ??
    `${window.location.protocol}//${window.location.hostname}:4000`,
  appUrl: normalizeUrl(window.location.origin),
};
