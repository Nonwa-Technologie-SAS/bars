import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/infrastructure/database/PrismaClient';
import type { Prisma } from '@prisma/client';

const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            products: true,
            tables: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant introuvable' },
        { status: 404 }
      );
    }

    const settings =
      tenant.settings && typeof tenant.settings === 'object'
        ? (tenant.settings as Record<string, unknown>)
        : {};

    const profile =
      settings.profile && typeof settings.profile === 'object'
        ? (settings.profile as Record<string, unknown>)
        : {};

    return NextResponse.json({
      tenant: {
        ...tenant,
        // champs "profil établissement" stockés temporairement dans settings.profile
        address: (profile.address as string | null) ?? null,
        phone: (profile.phone as string | null) ?? null,
        email: (profile.email as string | null) ?? null,
        website: (profile.website as string | null) ?? null,
        description: (profile.description as string | null) ?? null,
        stats: tenant._count,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching tenant:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur lors de la récupération des informations';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const body = await request.json();

    // Validate input
    const result = updateTenantSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        settings: true,
      },
    });

    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Tenant introuvable' },
        { status: 404 }
      );
    }

    const input = result.data;

    const normalize = (v: unknown) => {
      if (typeof v !== 'string') return v;
      const trimmed = v.trim();
      return trimmed.length === 0 ? null : v;
    };

    const baseSettings =
      existingTenant.settings && typeof existingTenant.settings === 'object'
        ? (existingTenant.settings as Record<string, unknown>)
        : {};

    const baseProfile =
      baseSettings.profile && typeof baseSettings.profile === 'object'
        ? (baseSettings.profile as Record<string, unknown>)
        : {};

    const nextProfile: Record<string, unknown> = {
      ...baseProfile,
      ...(input.address !== undefined ? { address: normalize(input.address) } : {}),
      ...(input.phone !== undefined ? { phone: normalize(input.phone) } : {}),
      ...(input.email !== undefined ? { email: normalize(input.email) } : {}),
      ...(input.website !== undefined ? { website: normalize(input.website) } : {}),
      ...(input.description !== undefined ? { description: normalize(input.description) } : {}),
    };

    const nextSettings: Record<string, unknown> = {
      ...baseSettings,
      profile: nextProfile,
    };

    // Champs "réels" (toujours disponibles dans ton Prisma actuel)
    const coreUpdate: Record<string, unknown> = {};
    if (input.name !== undefined) coreUpdate.name = input.name;
    if (input.logoUrl !== undefined) coreUpdate.logoUrl = input.logoUrl || null;

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...coreUpdate,
        settings: nextSettings as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        settings: true,
        updatedAt: true,
      },
    });

    const updatedSettings =
      updatedTenant.settings && typeof updatedTenant.settings === 'object'
        ? (updatedTenant.settings as Record<string, unknown>)
        : {};
    const updatedProfile =
      updatedSettings.profile && typeof updatedSettings.profile === 'object'
        ? (updatedSettings.profile as Record<string, unknown>)
        : {};

    return NextResponse.json({
      tenant: {
        ...updatedTenant,
        address: (updatedProfile.address as string | null) ?? null,
        phone: (updatedProfile.phone as string | null) ?? null,
        email: (updatedProfile.email as string | null) ?? null,
        website: (updatedProfile.website as string | null) ?? null,
        description: (updatedProfile.description as string | null) ?? null,
      },
    });
  } catch (error: unknown) {
    console.error('Error updating tenant:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
