import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest, ApiResponse } from "../types";
import { lookupQuerySchema, lookupResourceEnum, LookupResource } from "../validators/lookup.validator";

async function getPropertiesLookupData() {
    const [properties, activeContracts] = await Promise.all([
        prisma.properties.findMany({
            where: { deleted_at: null },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                type: true,
                units: {
                    where: { deleted_at: null },
                    orderBy: { unit_number: "asc" },
                    select: { id: true, unit_number: true, floor: true },
                },
            },
        }),
        prisma.contracts.findMany({
            where: {
                status: "active",
                deleted_at: null,
            },
            select: { unit_id: true },
        }),
    ]);

    const occupiedUnitIds = new Set(activeContracts.map((contract) => contract.unit_id));

    return properties
        .map((property) => ({
            ...property,
            units: property.units.filter((unit) => !occupiedUnitIds.has(unit.id)),
        }))
        .filter((property) => property.units.length > 0);
}

async function getClientsLookupData() {
    return prisma.clients.findMany({
        where: {
            deleted_at: null,
            contracts: {
                none: {
                    status: "active",
                    deleted_at: null,
                },
            },
        },
        orderBy: { full_name: "asc" },
        select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
        },
    });
}

function parseResources(resourcesParam?: string): LookupResource[] {
    if (!resourcesParam || resourcesParam.trim().length === 0) {
        return ["properties", "clients"];
    }

    const parsed = resourcesParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

    if (parsed.length === 0) {
        return ["properties", "clients"];
    }

    const validated = parsed.map((resource) => lookupResourceEnum.safeParse(resource));
    const invalid = validated
        .map((result, index) => ({ result, original: parsed[index] }))
        .filter((entry) => !entry.result.success)
        .map((entry) => entry.original);

    if (invalid.length > 0) {
        throw new Error(`Invalid lookup resource(s): ${invalid.join(", ")}`);
    }

    return validated
        .filter((entry): entry is { success: true; data: LookupResource } => entry.success)
        .map((entry) => entry.data);
}

/**
 * GET /api/lookups?resources=properties,clients
 * Dynamic reusable lookup endpoint.
 */
export const getLookups = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = lookupQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: "Invalid query params", details: parsed.error.flatten().fieldErrors });
            return;
        }

        let resources: LookupResource[];
        try {
            resources = parseResources(parsed.data.resources);
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : "Invalid lookup resources",
            });
            return;
        }

        const uniqueResources = Array.from(new Set(resources));
        const data: Record<string, unknown> = {};

        await Promise.all(
            uniqueResources.map(async (resource) => {
                if (resource === "properties") {
                    data.properties = await getPropertiesLookupData();
                }

                if (resource === "clients") {
                    data.clients = await getClientsLookupData();
                }
            })
        );

        res.json({ success: true, data } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
