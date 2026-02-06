import { Table } from "../entities/Table";

export interface ITableRepository {
  findById(id: string, tenantId: string): Promise<Table | null>;
  findByTenant(tenantId: string): Promise<Table[]>;
  findByQrCode(qrCodeUrl: string): Promise<Table | null>;
}
