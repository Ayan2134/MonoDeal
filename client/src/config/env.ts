declare const __MONODEAL_SOCKET_URL__: string | undefined;

function normalizeUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function resolveSocketUrl() {
  if (typeof __MONODEAL_SOCKET_URL__ === 'string' && __MONODEAL_SOCKET_URL__) {
    return __MONODEAL_SOCKET_URL__;
  }

  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

export const env = {
  socketUrl: resolveSocketUrl(),
  appUrl: normalizeUrl(window.location.origin),
};
