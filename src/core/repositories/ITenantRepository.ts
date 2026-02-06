import { Tenant } from "../entities/Tenant";

export interface ITenantRepository {
  findBySlug(slug: string): Promise<Tenant | null>;
  findById(id: string): Promise<Tenant | null>;
}
