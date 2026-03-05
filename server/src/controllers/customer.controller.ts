// ============================================================
// Keswani System — Customer Dashboard Controller
// Endpoints for authenticated clients to view their own data
// ============================================================

import { Response, NextFunction } from "express";
import { AuthenticatedRequest, ApiResponse } from "../types";
import { prisma } from "../config/prisma";

/**
 * GET /api/customer/dashboard
 * Returns the authenticated client's complete dashboard data:
 * - user profile
 * - active rent contract + property + recent payments
 * - electricity subscription + meter + recent bills
 * - reports (maintenance requests)
 */
export const getCustomerDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        console.log("[Dashboard] Starting request for user:", req.user);
        
        if (!req.user || req.user.user_type !== "client") {
            console.log("[Dashboard] Access denied - not a client");
            res.status(403).json({
                success: false,
                error: "Access denied. Clients only.",
            });
            return;
        }

        const clientId = req.user.profile_id;
        console.log("[Dashboard] Client ID:", clientId);

        // 1. Get client profile
        console.log("[Dashboard] Fetching client profile...");
        const client = await prisma.clients.findUnique({
            where: { id: clientId },
        });
        console.log("[Dashboard] Client profile:", client?.full_name);

        if (!client) {
            console.log("[Dashboard] Client not found");
            res.status(404).json({
                success: false,
                error: "Client profile not found",
            });
            return;
        }

        // Build user object
        const user = {
            id: client.id,
            name: client.full_name,
            nameAr: client.full_name, // TODO: add full_name_ar column if needed
            email: client.email,
            phone: client.phone,
            address: client.address || "",
            addressAr: client.address || "", // TODO: add address_ar column if needed
            subscriptionType: "rent_electricity", // Determine dynamically below
            languagePreference: "en", // TODO: add to clients table if needed
            accountCreated: client.created_at.toISOString().split("T")[0],
            avatar: null,
        };

        // 2. Get active rent contract + property + payments
        let rentData: any = null;
        console.log("[Dashboard] Fetching active contract for client:", clientId);
        const activeContract = await prisma.contracts.findFirst({
            where: {
                client_id: clientId,
                status: "active",
                deleted_at: null,
            },
            include: {
                unit: {
                    include: {
                        property: true,
                    },
                },
            },
        });
        console.log("[Dashboard] Active contract found:", activeContract?.id);

        if (activeContract && activeContract.unit) {
            console.log("[Dashboard] Processing rent data...");
            const unit = activeContract.unit;
            const property = unit.property;

            // Get recent rent payments (last 12 months)
            const payments = await prisma.rent_payments.findMany({
                where: {
                    contract_id: activeContract.id,
                },
                orderBy: {
                    period_start: "desc",
                },
                take: 12,
            });
            console.log("[Dashboard] Found", payments.length, "rent payments");

            // Get maintenance requests for this unit
            const maintenanceRequests = await prisma.maintenance_requests.findMany({
                where: {
                    unit_id: unit.id,
                    requested_by: clientId,
                    deleted_at: null,
                },
                orderBy: {
                    created_at: "desc",
                },
                take: 10,
            });
            console.log("[Dashboard] Found", maintenanceRequests.length, "maintenance requests");

            rentData = {
                property: {
                    id: property.id,
                    name: property.name,
                    nameAr: property.name, // TODO: add name_ar to properties
                    address: property.address,
                    addressAr: property.address, // TODO: add address_ar
                    unitNumber: unit.unit_number,
                    type: property.type,
                },
                contract: {
                    id: activeContract.id,
                    startDate: typeof activeContract.start_date === 'string' ? activeContract.start_date : activeContract.start_date.toISOString().split("T")[0],
                    endDate: activeContract.end_date ? (typeof activeContract.end_date === 'string' ? activeContract.end_date : activeContract.end_date.toISOString().split("T")[0]) : null,
                    monthlyRent: parseFloat(activeContract.monthly_rent.toString()),
                    deposit: parseFloat((activeContract.deposit_amount || 0).toString()),
                    status: activeContract.status,
                    autoRenew: false, // TODO: add to schema if needed
                },
                payments: payments.map((p: any) => {
                    try {
                        return {
                            id: p.id,
                            amount: parseFloat(p.amount.toString()),
                            date: p.paid_at ? (typeof p.paid_at === 'string' ? p.paid_at.split('T')[0] : (p.paid_at instanceof Date ? p.paid_at.toISOString().split("T")[0] : p.paid_at)) : null,
                            status: p.status,
                            month: p.period_start ? (typeof p.period_start === 'string' ? p.period_start : p.period_start.toISOString().split("T")[0]) : null,
                            receiptNumber: null, // TODO: add to schema if needed
                        };
                    } catch (err) {
                        console.error("[Dashboard] Error mapping payment:", p, err);
                        throw err;
                    }
                }),
                maintenanceRequests: maintenanceRequests.map((mr: any) => ({
                    id: mr.id,
                    title: mr.title,
                    titleAr: mr.title, // TODO: add title_ar if needed
                    description: mr.description,
                    descriptionAr: mr.description, // TODO: add description_ar if needed
                    priority: mr.priority,
                    status: mr.status,
                    createdAt: mr.created_at.toISOString().split("T")[0],
                    updatedAt: mr.updated_at.toISOString().split("T")[0],
                })),
            };
            console.log("[Dashboard] Rent data processed successfully");
        } else {
            console.log("[Dashboard] No active contract found for client");
        }

        // 3. Get electricity subscription + meter + bills
        let electricityData: any = null;
        console.log("[Dashboard] Fetching electricity subscriber...");
        try {
            const subscriber = await prisma.subscribers.findFirst({
                where: {
                    client_id: clientId,
                    is_active: true,
                    deleted_at: null,
                },
                include: {
                    meters: {
                        where: {
                            is_active: true,
                            deleted_at: null,
                        },
                        include: {
                            readings: {
                                orderBy: {
                                    reading_date: "desc",
                                },
                                take: 12,
                            },
                            bills: {
                                orderBy: {
                                    billing_period_start: "desc",
                                },
                                take: 12,
                            },
                        },
                    },
                },
            });

            console.log("[Dashboard] Subscriber found:", subscriber?.subscription_number);

            if (subscriber && subscriber.meters.length > 0) {
                console.log("[Dashboard] Processing electricity data...");
                const meter = subscriber.meters[0];
                const readings = meter.readings;
                const bills = meter.bills;

                // Get bill payments
                const billIds = bills.map((b: any) => b.id);
                const billPayments = await prisma.bill_payments.findMany({
                    where: {
                        bill_id: { in: billIds },
                    },
                });

                // Get current pricing (use Date objects for Date fields)
                const today = new Date();
                const currentPricing = await prisma.pricing_history.findFirst({
                    where: {
                        OR: [
                            { effective_to: null },
                            { effective_to: { gte: today } },
                        ],
                        effective_from: { lte: today },
                    },
                    orderBy: {
                        effective_from: "desc",
                    },
                });

                electricityData = {
                    meterId: meter.id,
                    meterType: meter.meter_type,
                    readings: readings.map((r: any) => ({
                        id: r.id,
                        month: typeof r.reading_date === 'string' ? r.reading_date : r.reading_date.toISOString().split("T")[0],
                        previousReading: 0, // Calculate from previous reading
                        currentReading: parseFloat(r.reading_value.toString()),
                        consumption: 0, // Calculate
                        readingDate: typeof r.reading_date === 'string' ? r.reading_date : r.reading_date.toISOString().split("T")[0],
                        readBy: r.recorded_by,
                    })),
                    bills: bills.map((b: any) => {
                        const payments = billPayments.filter((bp: any) => bp.bill_id === b.id);
                        const totalPaid = payments.reduce(
                            (sum: number, p: any) => sum + parseFloat(p.amount.toString()),
                            0
                        );

                        return {
                            id: b.id,
                            month: typeof b.billing_period_start === 'string' ? b.billing_period_start : b.billing_period_start.toISOString().split("T")[0],
                            consumption: parseFloat(b.consumption_kwh.toString()),
                            pricePerKwh: parseFloat(b.price_per_kwh.toString()),
                            baseAmount: parseFloat(b.total_amount.toString()),
                            additionalFees: 0, // TODO: add to schema if needed
                            totalAmount: parseFloat(b.total_amount.toString()),
                            status: b.status,
                            dueDate: typeof b.billing_period_end === 'string' ? b.billing_period_end : b.billing_period_end.toISOString().split("T")[0],
                            createdAt: b.created_at.toISOString().split("T")[0],
                        };
                    }),
                    payments: billPayments.map((bp: any) => ({
                        id: bp.id,
                        billId: bp.bill_id,
                        amount: parseFloat(bp.amount.toString()),
                        date: typeof bp.payment_date === 'string' ? bp.payment_date : bp.payment_date.toISOString().split("T")[0],
                        collectedBy: bp.received_by,
                    })),
                    currentPricePerKwh: currentPricing
                        ? parseFloat(currentPricing.price_per_kwh.toString())
                        : 0.15,
                };
            }
        } catch (electricityError) {
            console.error("[Electricity Query Error]", electricityError);
            // Continue without electricity data if query fails
            electricityData = null;
        }

        // 4. Determine subscription type
        let subscriptionType = "none";
        if (rentData && electricityData) {
            subscriptionType = "rent_electricity";
        } else if (rentData) {
            subscriptionType = "rent";
        } else if (electricityData) {
            subscriptionType = "electricity";
        }
        user.subscriptionType = subscriptionType;

        // 5. Reports (empty for now - can add notifications or custom reports)
        const reports: any[] = [];

        console.log("[Dashboard] Request successful - sending response");
        console.log("[Dashboard] Subscription type:", subscriptionType);
        res.json({
            success: true,
            data: {
                user,
                rent: rentData,
                electricity: electricityData,
                reports,
            },
        } as ApiResponse);
    } catch (err) {
        console.error("[Customer Dashboard Error]", err instanceof Error ? err.message : err);
        console.error("[Customer Dashboard Stack]", err instanceof Error ? err.stack : "");
        next(err);
    }
};
