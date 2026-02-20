import { Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
    createPropertySchema,
    updatePropertySchema,
    propertyQuerySchema,
} from "../validators/property.validator";
import { AuthenticatedRequest, ApiResponse } from "../types";

// Helper: compute rented count for a property
async function computeRentedCount(propertyId: string): Promise<number> {
    return prisma.contracts.count({
        where: {
            unit: { property_id: propertyId, deleted_at: null },
            status: "active",
            deleted_at: null,
        },
    });
}

// Shared include for property queries
const propertyInclude = {
    units: {
        where: { deleted_at: null } as Prisma.unitsWhereInput,
        select: {
            id: true,
            unit_number: true,
            floor: true,
            bedrooms: true,
            bathrooms: true,
            area_sqm: true,
            description: true,
            is_available: true,
        },
    },
    manager: {
        select: { id: true, full_name: true },
    },
} as const;

/**
 * GET /api/properties
 * List properties with filtering (type) + pagination + search.
 */
export const getProperties = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = propertyQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Invalid query params", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const { page, limit, search, type } = parsed.data;
        const skip = (page - 1) * limit;

        const where: Prisma.propertiesWhereInput = { deleted_at: null };
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { address: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                { city: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
            ];
        }

        const [properties, total] = await Promise.all([
            prisma.properties.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: propertyInclude,
            }),
            prisma.properties.count({ where }),
        ]);

        const enriched = await Promise.all(
            properties.map(async (prop) => {
                const totalUnits = prop.units.length;
                const rentedCount = await computeRentedCount(prop.id);
                return {
                    id: prop.id,
                    name: prop.name,
                    address: prop.address,
                    city: prop.city,
                    type: prop.type,
                    managed_by: prop.managed_by,
                    manager_name: prop.manager?.full_name || null,
                    owner_notes: prop.owner_notes,
                    total_units: totalUnits,
                    rented_units: rentedCount,
                    available_units: totalUnits - rentedCount,
                    units: prop.units,
                    created_at: prop.created_at,
                    updated_at: prop.updated_at,
                };
            })
        );

        res.json({
            success: true,
            data: {
                items: enriched,
                pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/properties/:id
 * Single property with all units.
 */
export const getPropertyById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const property = await prisma.properties.findFirst({
            where: { id, deleted_at: null },
            include: propertyInclude,
        });

        if (!property) {
            res.status(404).json({ success: false, error: "Property not found" });
            return;
        }

        const rentedCount = await computeRentedCount(property.id);

        res.json({
            success: true,
            data: {
                id: property.id,
                name: property.name,
                address: property.address,
                city: property.city,
                type: property.type,
                managed_by: property.managed_by,
                manager_name: property.manager?.full_name || null,
                owner_notes: property.owner_notes,
                total_units: property.units.length,
                rented_units: rentedCount,
                available_units: property.units.length - rentedCount,
                units: property.units,
                created_at: property.created_at,
                updated_at: property.updated_at,
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/properties/lookup
 * Lightweight list for dropdowns.
 */
export const getPropertiesLookup = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const properties = await prisma.properties.findMany({
            where: { deleted_at: null },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                type: true,
                units: {
                    where: { deleted_at: null },
                    orderBy: { unit_number: "asc" },
                    select: { id: true, unit_number: true, floor: true, is_available: true },
                },
            },
        });

        res.json({ success: true, data: properties } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/properties
 * Create a new property with optional units (for buildings).
 */
export const createProperty = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = createPropertySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const { units, managed_by, ...rest } = parsed.data;

        const createData: Prisma.propertiesCreateInput = {
            name: rest.name,
            address: rest.address,
            city: rest.city,
            type: rest.type,
            owner_notes: rest.owner_notes,
        };

        // If caller provided managed_by use it; otherwise set manager from authenticated user (if employee)
        if (managed_by) {
            createData.manager = { connect: { id: managed_by } };
        } else if (req.user && req.user.user_type === "employee") {
            // req.user.profile_id is the employee id
            createData.manager = { connect: { id: req.user.profile_id } };
        }

        if (units && units.length > 0) {
            createData.units = {
                create: units.map((u) => ({
                    unit_number: u.unit_number,
                    floor: u.floor,
                    bedrooms: u.bedrooms,
                    bathrooms: u.bathrooms,
                    area_sqm: u.area_sqm,
                    description: u.description,
                })),
            };
        }

        const property = await prisma.properties.create({
            data: createData,
            include: propertyInclude,
        });

        res.status(201).json({
            success: true,
            data: {
                id: property.id,
                name: property.name,
                address: property.address,
                city: property.city,
                type: property.type,
                managed_by: property.managed_by,
                manager_name: property.manager?.full_name || null,
                owner_notes: property.owner_notes,
                total_units: property.units.length,
                rented_units: 0,
                available_units: property.units.length,
                units: property.units,
                created_at: property.created_at,
                updated_at: property.updated_at,
            },
            message: "Property created successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/properties/:id
 * Update property fields.
 */
export const updateProperty = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.properties.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Property not found" });
            return;
        }

        const parsed = updatePropertySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors });
            return;
        }

        const { managed_by, ...rest } = parsed.data;
        const updateData: Prisma.propertiesUpdateInput = { ...rest };
        if (managed_by !== undefined) {
            if (managed_by === null) {
                updateData.manager = { disconnect: true };
            } else {
                updateData.manager = { connect: { id: managed_by } };
            }
        }

        const property = await prisma.properties.update({
            where: { id },
            data: updateData,
            include: propertyInclude,
        });

        const rentedCount = await computeRentedCount(id);

        res.json({
            success: true,
            data: {
                id: property.id,
                name: property.name,
                address: property.address,
                city: property.city,
                type: property.type,
                managed_by: property.managed_by,
                manager_name: property.manager?.full_name || null,
                owner_notes: property.owner_notes,
                total_units: property.units.length,
                rented_units: rentedCount,
                available_units: property.units.length - rentedCount,
                units: property.units,
                created_at: property.created_at,
                updated_at: property.updated_at,
            },
            message: "Property updated successfully",
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/properties/:id
 * Soft delete — only if no active contracts on any of its units.
 */
export const deleteProperty = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.properties.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            res.status(404).json({ success: false, error: "Property not found" });
            return;
        }

        const activeContracts = await computeRentedCount(id);

        if (activeContracts > 0) {
            res.status(409).json({
                success: false,
                error: `Cannot delete: property has ${activeContracts} active contract(s). Terminate or expire them first.`,
            });
            return;
        }

        const now = new Date();
        await prisma.$transaction([
            prisma.units.updateMany({
                where: { property_id: id, deleted_at: null },
                data: { deleted_at: now },
            }),
            prisma.properties.update({
                where: { id },
                data: { deleted_at: now },
            }),
        ]);

        res.json({ success: true, message: "Property and its units have been soft-deleted" } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
