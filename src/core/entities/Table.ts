export interface Table {
  id: string;
  label: string;
  qrCodeUrl: string;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
