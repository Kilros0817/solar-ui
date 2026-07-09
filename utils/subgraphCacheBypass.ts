/**
 * When refetch is triggered after a contract interaction, we bypass Redis cache
 * on the server so the next subgraph requests get fresh indexed data.
 */
let bypassUntil = 0;

export function setBypassCacheUntil(msFromNow: number): void {
  bypassUntil = Date.now() + msFromNow;
}

export function shouldBypassCache(): boolean {
  return Date.now() < bypassUntil;
}
