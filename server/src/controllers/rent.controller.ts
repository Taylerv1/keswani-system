import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest, ApiResponse } from "../types";
import {
    ensurePaymentSchedulesForActiveContracts,
    markOverdueRentPayments,
} from "../services/payment-schedule.service";

const CONTRACT_ENDING_SOON_DAYS = 60;

/**
 * GET /api/rent/overview
 * Returns dashboard KPI summary for the rent module.
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
            },
        } as ApiResponse);
    } catch (err) {
        next(err);
    }
};
