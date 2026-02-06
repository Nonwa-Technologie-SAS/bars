export enum UserRole {
  ADMIN = "ADMIN",
  BARTENDER = "BARTENDER",
  WAITER = "WAITER",
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  tenantId: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}
