import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest, ApiResponse } from "../types";
import {
    ensurePaymentSchedulesForActiveContracts,
    markOverdueRentPayments,
} from "../services/payment-schedule.service";

const CONTRACT_ENDING_SOON_DAYS = 60;
const RECENT_ACTIVITY_LIMIT = 10;

// ─── Helper: build recent‑activity items from real data ────────────
interface RecentActivityItem {
    id: string;
    type: "late_payment" | "contract_ending" | "maintenance" | "vacant_property";
    title: string;
    title_ar: string;
    message: string;
    message_ar: string;
    related_id: string;
    created_at: string;
}

async function buildRecentActivity(
    endingCutoff: Date
): Promise<RecentActivityItem[]> {
    const items: RecentActivityItem[] = [];

    // 1) Overdue rent payments
    const overduePayments = await prisma.rent_payments.findMany({
        where: {
            status: "overdue",
            deleted_at: null,
            contract: {
                unit: {
                    property: { ...( { is_for_rent: true } as any ) },
                },
            },
        },
        orderBy: { created_at: "desc" },
        take: RECENT_ACTIVITY_LIMIT,
        include: {
            contract: {
                include: {
                    client: { select: { full_name: true } },
                    unit: {
                        select: {
                            unit_number: true,
                            property: { select: { name: true } },
                        },
                    },
                },
            },
        },
    });

    for (const p of overduePayments) {
        const client = p.contract.client.full_name;
        const unit = p.contract.unit.unit_number;
        const prop = p.contract.unit.property.name;
        items.push({
            id: `activity-lp-${p.id}`,
            type: "late_payment",
            title: "Late Payment",
            title_ar: "دفع متأخر",
            message: `${client} has an overdue payment (${prop}, Unit ${unit})`,
            message_ar: `${client} لديه دفعة متأخرة (${prop}، وحدة ${unit})`,
            related_id: p.id,
            created_at: p.created_at.toISOString(),
        });
    }

    // 2) Contracts ending soon
    const endingContracts = await prisma.contracts.findMany({
        where: {
            status: "active",
            deleted_at: null,
            end_date: { gte: new Date(), lte: endingCutoff },
            unit: {
                property: { ...( { is_for_rent: true } as any ) },
            },
        },
        orderBy: { end_date: "asc" },
        take: RECENT_ACTIVITY_LIMIT,
        include: {
            client: { select: { full_name: true } },
            unit: {
                select: {
                    unit_number: true,
                    property: { select: { name: true } },
                },
            },
        },
    });

    for (const c of endingContracts) {
        const endStr = c.end_date
            ? new Date(c.end_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
              })
            : "N/A";
        items.push({
            id: `activity-ce-${c.id}`,
            type: "contract_ending",
            title: "Contract Ending Soon",
            title_ar: "العقد ينتهي قريباً",
            message: `Contract for ${c.client.full_name} (${c.unit.unit_number}, ${c.unit.property.name}) ends on ${endStr}`,
            message_ar: `عقد ${c.client.full_name} (${c.unit.unit_number}، ${c.unit.property.name}) ينتهي في ${endStr}`,
            related_id: c.id,
            created_at: c.updated_at.toISOString(),
        });
    }

    // 3) Recent open maintenance requests
    const maintenance = await prisma.maintenance_requests.findMany({
        where: {
            deleted_at: null,
            status: { in: ["pending", "in_progress"] },
            unit: {
                property: { ...( { is_for_rent: true } as any ) },
            },
        },
        orderBy: { created_at: "desc" },
        take: RECENT_ACTIVITY_LIMIT,
        include: {
            unit: {
                select: {
                    unit_number: true,
                    property: { select: { name: true } },
                },
            },
        },
    });

    for (const m of maintenance) {
        items.push({
            id: `activity-mt-${m.id}`,
            type: "maintenance",
            title: m.title || "Maintenance Request",
            title_ar: "طلب صيانة",
            message: `${m.title} at ${m.unit.property.name}, Unit ${m.unit.unit_number}`,
            message_ar: `${m.title} في ${m.unit.property.name}، وحدة ${m.unit.unit_number}`,
            related_id: m.id,
            created_at: m.created_at.toISOString(),
        });
    }

    // Sort all by created_at desc and trim
    items.sort(
        (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return items.slice(0, RECENT_ACTIVITY_LIMIT);
}

/**
 * GET /api/rent/overview
 * Returns dashboard KPI summary + recent activity for the rent module.
 */
export const getRentOverview = async (
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await ensurePaymentSchedulesForActiveContracts();
        await markOverdueRentPayments();

        const now = new Date();
        const endingCutoff = new Date(now);
        endingCutoff.setDate(endingCutoff.getDate() + CONTRACT_ENDING_SOON_DAYS);

        const [
            totalProperties,
            totalUnits,
            rentedUnits,
            monthlyIncomeAgg,
            latePayments,
            contractsEndingSoon,
            openMaintenance,
            tenantContractRows,
            recentActivity,
        ] = await Promise.all([
            prisma.properties.count({
                where: { deleted_at: null, ...( { is_for_rent: true } as any ) },
            }),
            prisma.units.count({
                where: {
                    deleted_at: null,
                    property: { ...( { is_for_rent: true } as any ) },
                },
            }),
            prisma.contracts.count({
                where: {
                    status: "active",
                    deleted_at: null,
                    unit: {
                        deleted_at: null,
                        property: { ...( { is_for_rent: true } as any ) },
                    },
                },
            }),
            prisma.contracts.aggregate({
                where: {
                    status: "active",
                    deleted_at: null,
                    unit: {
                        property: { ...( { is_for_rent: true } as any ) },
                    },
                },
                _sum: { monthly_rent: true },
            }),
            prisma.rent_payments.count({
                where: {
                    status: "overdue",
                    deleted_at: null,
                    contract: {
                        unit: {
                            property: { ...( { is_for_rent: true } as any ) },
                        },
                    },
                },
            }),
            prisma.contracts.count({
                where: {
                    status: "active",
                    deleted_at: null,
                    end_date: {
                        gte: now,
                        lte: endingCutoff,
                    },
                    unit: {
                        property: { ...( { is_for_rent: true } as any ) },
                    },
                },
            }),
            prisma.maintenance_requests.count({
                where: {
                    deleted_at: null,
                    status: { in: ["pending", "in_progress"] },
                    unit: {
                        property: { ...( { is_for_rent: true } as any ) },
                    },
                },
            }),
            // Count unique tenants with ACTIVE contracts only
            prisma.contracts.findMany({
                where: {
                    status: "active",
                    deleted_at: null,
                    unit: {
                        property: { ...( { is_for_rent: true } as any ) },
                    },
                },
                distinct: ["client_id"],
                select: { client_id: true },
            }),
            buildRecentActivity(endingCutoff),
        ]);

        const vacantUnits = Math.max(totalUnits - rentedUnits, 0);
        const occupancyRate = totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0;
        const totalTenants = tenantContractRows.length;

        res.json({
            success: true,
            data: {
                total_properties: totalProperties,
                total_units: totalUnits,
                rented_units: rentedUnits,
                vacant_units: vacantUnits,
                total_tenants: totalTenants,
                monthly_income: Number(monthlyIncomeAgg._sum.monthly_rent || 0),
                late_payments: latePayments,
                contracts_ending_soon: contractsEndingSoon,
                maintenance_notifications: openMaintenance,
                occupancy_rate: occupancyRate,
                contracts_ending_window_days: CONTRACT_ENDING_SOON_DAYS,
                recent_activity: recentActivity,
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
