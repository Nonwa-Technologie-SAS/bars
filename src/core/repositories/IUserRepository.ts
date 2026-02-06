import { User } from '../entities/User';

export interface IUserRepository {
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findById(id: string, tenantId: string): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  findAll(tenantId: string, filters?: { query?: string; role?: string }): Promise<User[]>;
  update(id: string, tenantId: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User>;
  delete(id: string, tenantId: string): Promise<void>;
}
