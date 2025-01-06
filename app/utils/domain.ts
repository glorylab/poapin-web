// app/utils/domain.ts
export const MAIN_DOMAIN = 'poap.in';

export function getMainDomainUrl(path: string = '/'): string {
  return `https://${MAIN_DOMAIN}${path}`;
}

export function redirectToMainDomain(request: Request): URL {
  const url = new URL(request.url);
  const newUrl = new URL(url.pathname + url.search, getMainDomainUrl());
  return newUrl;
}
