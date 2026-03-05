import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest, ApiResponse } from "../types";
import {
    lookupQuerySchema,
    lookupResourceEnum,
    LookupContext,
    LookupResource,
} from "../validators/lookup.validator";

async function getPropertiesLookupData(context: LookupContext) {
    const propertyWhere: Record<string, unknown> = { deleted_at: null };
    if (context === "electricity") {
        propertyWhere.is_for_electricity = true;
    } else {
        propertyWhere.is_for_rent = true;
    }

    const [properties, activeContracts] = await Promise.all([
        prisma.properties.findMany({
            where: propertyWhere as any,
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
        context === "electricity"
            ? Promise.resolve([])
            : prisma.contracts.findMany({
                where: {
                    status: "active",
                    deleted_at: null,
                    unit: {
                        property: { ...( { is_for_rent: true } as any ) },
                    },
                },
                select: { unit_id: true },
            }),
    ]);

    const occupiedUnitIds = new Set(activeContracts.map((contract) => contract.unit_id));

    const includeUnit = (unitId: string) => {
        if (context === "electricity") {
            return true;
        }

        if (context === "maintenance") {
            return occupiedUnitIds.has(unitId);
        }

        return !occupiedUnitIds.has(unitId);
    };

    return properties
        .map((property) => ({
            ...property,
            units: property.units.filter((unit) => includeUnit(unit.id)),
        }))
        .filter((property) =>
            context === "electricity" ? true : property.units.length > 0
        );
}

async function getClientsLookupData(context: LookupContext) {
    const clients = await prisma.clients.findMany({
        where: {
            deleted_at: null,
            ...(context !== "electricity"
                ? {
                    contracts: {
                        ...(context === "maintenance"
                            ? {
                                some: {
                                    status: "active",
                                    deleted_at: null,
                                    unit: {
                                        property: { ...( { is_for_rent: true } as any ) },
                                    },
                                },
                            }
                            : {
                                none: {
                                    status: "active",
                                    deleted_at: null,
                                    unit: {
                                        property: { ...( { is_for_rent: true } as any ) },
                                    },
                                },
                            }),
                    },
                }
                : {}),
        },
        orderBy: { full_name: "asc" },
        select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            contracts: {
                where: {
                    status: "active",
                    deleted_at: null,
                    unit: {
                        property: { ...( { is_for_rent: true } as any ) },
                    },
                },
                orderBy: {
                    updated_at: "desc",
                },
                take: 1,
                select: {
                    id: true,
                    unit: {
                        select: {
                            property_id: true,
                            unit_number: true,
                        },
                    },
                },
            },
        },
    });

    return clients.map((client) => {
        const activeContract = client.contracts[0];
        return {
            id: client.id,
            full_name: client.full_name,
            email: client.email,
            phone: client.phone,
            contract_id: activeContract?.id ?? null,
            property_id: activeContract?.unit.property_id ?? null,
            unit_number: activeContract?.unit.unit_number ?? null,
        };
    });
}

async function getEmployeesLookupData() {
    const employees = await prisma.employees.findMany({
        where: {
            deleted_at: null,
            is_active: true,
        },
        orderBy: { full_name: "asc" },
        select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            role: true,
            access: true,
        },
    });

    return employees.map((employee) => ({
        id: employee.id,
        full_name: employee.full_name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        access: employee.access,
    }));
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

        const context: LookupContext = parsed.data.context ?? "contract";
        const uniqueResources = Array.from(new Set(resources));
        const data: Record<string, unknown> = {};

        await Promise.all(
            uniqueResources.map(async (resource) => {
                if (resource === "properties") {
                    data.properties = await getPropertiesLookupData(context);
                }

                if (resource === "clients") {
                    data.clients = await getClientsLookupData(context);
                }

                if (resource === "employees") {
                    data.employees = await getEmployeesLookupData();
                }
            })
        );

        res.json({ success: true, data } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
