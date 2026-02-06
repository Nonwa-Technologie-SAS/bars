type Subscription = unknown;

const registry = new Map<string, Map<string, Subscription[]>>();

export function addSubscription(
  tenantId: string,
  userId: string,
  subscription: Subscription,
) {
  if (!tenantId || !userId) return;
  const t = registry.get(tenantId) || new Map<string, Subscription[]>();
  const list = t.get(userId) || [];
  const key = JSON.stringify(subscription);
  if (!list.some((s) => JSON.stringify(s) === key)) {
    list.push(subscription);
  }
  t.set(userId, list);
  registry.set(tenantId, t);
}

export function getSubscriptions(
  tenantId: string,
  userId?: string,
): Subscription[] {
  const t = registry.get(tenantId);
  if (!t) return [];
  if (userId) return t.get(userId) || [];
  // flatten all users
  const all: Subscription[] = [];
  t.forEach((arr) => all.push(...arr));
  return all;
}
