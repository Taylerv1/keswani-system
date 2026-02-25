import { Response, NextFunction } from "express";
import prisma from "../../config/prisma";
import { AuthenticatedRequest, ApiResponse } from "../../types";

const CONTRACT_ENDING_SOON_DAYS = 60;

interface RecentActivityItem {
    id: string;
    type: "payment" | "contract" | "maintenance";
    title: string;
    message: string;
    related_id: string;
    created_at: Date;
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
            recentPayments,
            recentContracts,
            recentMaintenanceReqs,
        ] = await Promise.all([
            prisma.properties.count({
                where: { deleted_at: null },
            }),
            prisma.units.count({
                where: { deleted_at: null },
            }),
            prisma.contracts.count({
                where: {
                    status: "active",
                    deleted_at: null,
                    unit: { deleted_at: null },
                },
            }),
            prisma.contracts.aggregate({
                where: {
                    status: "active",
                    deleted_at: null,
                },
                _sum: { monthly_rent: true },
            }),
            prisma.rent_payments.count({
                where: {
                    status: "overdue",
                    deleted_at: null,
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
                },
            }),
            prisma.maintenance_requests.count({
                where: {
                    deleted_at: null,
                    status: { in: ["pending", "in_progress"] },
                },
            }),
            prisma.contracts.findMany({
                where: { deleted_at: null },
                distinct: ["client_id"],
                select: { client_id: true },
            }),
            // Recent activity: latest payments
            prisma.rent_payments.findMany({
                where: { deleted_at: null },
                orderBy: { created_at: "desc" },
                take: 5,
                include: {
                    contract: {
                        select: {
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
            }),
            // Recent activity: latest contracts
            prisma.contracts.findMany({
                where: { deleted_at: null },
                orderBy: { created_at: "desc" },
                take: 5,
                include: {
                    client: { select: { full_name: true } },
                    unit: {
                        select: {
                            unit_number: true,
                            property: { select: { name: true } },
                        },
                    },
                },
            }),
            // Recent activity: latest maintenance requests
            prisma.maintenance_requests.findMany({
                where: { deleted_at: null },
                orderBy: { created_at: "desc" },
                take: 5,
                include: {
                    unit: {
                        select: {
                            unit_number: true,
                            property: { select: { name: true } },
                        },
                    },
                },
            }),
        ]);

        const vacantUnits = Math.max(totalUnits - rentedUnits, 0);
        const occupancyRate = totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0;
        const totalTenants = tenantContractRows.length;

        // Build recent activity feed
        const activityItems: RecentActivityItem[] = [];

        for (const p of recentPayments) {
            const tenant = p.contract.client.full_name;
            const prop = p.contract.unit.property.name;
            activityItems.push({
                id: p.id,
                type: "payment",
                title: `Payment ${p.status} — $${Number(p.amount)}`,
                message: `${tenant} • ${prop} Unit ${p.contract.unit.unit_number}`,
                related_id: p.id,
                created_at: p.created_at,
            });
        }

        for (const c of recentContracts) {
            const tenant = c.client.full_name;
            const prop = c.unit.property.name;
            activityItems.push({
                id: c.id,
                type: "contract",
                title: `Contract ${c.status}`,
                message: `${tenant} • ${prop} Unit ${c.unit.unit_number} — $${Number(c.monthly_rent)}/mo`,
                related_id: c.id,
                created_at: c.created_at,
            });
        }

        for (const m of recentMaintenanceReqs) {
            const prop = m.unit.property.name;
            activityItems.push({
                id: m.id,
                type: "maintenance",
                title: m.title,
                message: `${prop} Unit ${m.unit.unit_number} — ${m.priority} priority`,
                related_id: m.id,
                created_at: m.created_at,
            });
        }

        // Sort by created_at desc, take top 10
        activityItems.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        const recentActivity = activityItems.slice(0, 10);

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
