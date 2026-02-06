export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
