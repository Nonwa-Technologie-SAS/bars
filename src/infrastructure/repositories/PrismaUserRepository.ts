import { IUserRepository } from "@/core/repositories/IUserRepository";
import { User, UserRole } from "@/core/entities/User";
import { prisma } from "@/infrastructure/database/PrismaClient";
import type { User as PrismaUser, Prisma } from "@prisma/client";

export class PrismaUserRepository implements IUserRepository {
  async create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const created = await prisma.user.create({
      data: {
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
    return this.mapToEntity(created);
  }

  async findById(id: string, tenantId: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { id, tenantId },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { email, tenantId },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async findAll(tenantId: string, filters?: { query?: string; role?: string }): Promise<User[]> {
    const where: Prisma.UserWhereInput = { tenantId };
    if (filters?.role) {
      where.role = filters.role as UserRole;
    }
    if (filters?.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { email: { contains: filters.query, mode: 'insensitive' } },
      ];
    }
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return users.map(this.mapToEntity);
  }

  async update(id: string, tenantId: string, data: Partial<User>): Promise<User> {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...data,
      },
    });
    return this.mapToEntity(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.user.deleteMany({
      where: { id, tenantId },
    });
  }

  private mapToEntity(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.password,
      name: prismaUser.name ?? undefined,
      role: prismaUser.role as UserRole,
      tenantId: prismaUser.tenantId,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
