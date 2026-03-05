import { NextFunction, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiResponse, AuthenticatedRequest } from "../types";
import {
    createPricingPlanSchema,
    updatePricingPlanSchema,
} from "../validators/pricing.validator";

type PricingNotesMeta = {
    name?: string;
    description?: string;
    features?: string[];
};

const parseNotesMeta = (notes: string | null): PricingNotesMeta => {
    if (!notes) return {};

    try {
        const parsed = JSON.parse(notes) as PricingNotesMeta;
        if (typeof parsed === "object" && parsed !== null) {
            return {
                name: typeof parsed.name === "string" ? parsed.name : undefined,
                description: typeof parsed.description === "string" ? parsed.description : undefined,
                features: Array.isArray(parsed.features)
                    ? parsed.features.filter((item): item is string => typeof item === "string")
                    : undefined,
            };
        }
        return {};
    } catch {
        return { description: notes };
    }
};

const toNumber = (value: unknown): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const formatDateOnly = (dateValue: Date | null): string | null => {
    if (!dateValue) return null;
    return dateValue.toISOString().slice(0, 10);
};

const toApiPricingPlan = (
    plan: {
        id: string;
        price_per_kwh: Prisma.Decimal;
        currency: string;
        effective_from: Date;
        effective_to: Date | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
    }
) => {
    const meta = parseNotesMeta(plan.notes);
    const fallbackName = `Plan ${formatDateOnly(plan.effective_from) ?? ""}`.trim();

    return {
        id: plan.id,
        name: meta.name || fallbackName,
        price: toNumber(plan.price_per_kwh),
        description: meta.description || "",
        features: meta.features ?? [],
        currency: plan.currency,
        effective_from: formatDateOnly(plan.effective_from),
        effective_to: formatDateOnly(plan.effective_to),
        created_at: plan.created_at,
        updated_at: plan.updated_at,
    };
};

export const getPricingPlans = async (
    _req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
) => {
    try {
        const plans = await prisma.pricing_history.findMany({
            orderBy: [
                { effective_from: "desc" },
                { created_at: "desc" },
            ],
        });

        res.status(200).json({
            success: true,
            data: plans.map((plan) => toApiPricingPlan(plan)),
        });
    } catch (error) {
        next(error);
    }
};

export const createPricingPlan = async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
) => {
    try {
        const payload = createPricingPlanSchema.parse(req.body);

        const notes = JSON.stringify({
            name: payload.name,
            description: payload.description,
            features: payload.features,
        });

        const created = await prisma.pricing_history.create({
            data: {
                price_per_kwh: new Prisma.Decimal(payload.price),
                currency: "USD",
                effective_from: payload.effective_from
                    ? new Date(payload.effective_from)
                    : new Date(),
                effective_to: payload.effective_to ? new Date(payload.effective_to) : null,
                notes,
                set_by:
                    req.user?.user_type === "employee"
                        ? req.user.profile_id
                        : null,
            },
        });

        res.status(201).json({
            success: true,
            message: "Pricing plan created successfully",
            data: toApiPricingPlan(created),
        });
    } catch (error) {
        next(error);
    }
};

export const updatePricingPlan = async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
) => {
    try {
        const idParam = req.params.id;
        const id = Array.isArray(idParam) ? idParam[0] : idParam;

        if (!id) {
            res.status(400).json({
                success: false,
                error: "Pricing plan id is required",
            });
            return;
        }

        const payload = updatePricingPlanSchema.parse(req.body);

        const existing = await prisma.pricing_history.findUnique({ where: { id } });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: "Pricing plan not found",
            });
            return;
        }

        const currentMeta = parseNotesMeta(existing.notes);

        const updatedMeta: PricingNotesMeta = {
            name: payload.name ?? currentMeta.name,
            description: payload.description ?? currentMeta.description,
            features: payload.features ?? currentMeta.features ?? [],
        };

        const updateData: Prisma.pricing_historyUpdateInput = {
            ...(payload.price !== undefined
                ? { price_per_kwh: new Prisma.Decimal(payload.price) }
                : {}),
            ...(payload.effective_from !== undefined
                ? { effective_from: new Date(payload.effective_from) }
                : {}),
            ...(payload.effective_to !== undefined
                ? {
                    effective_to: payload.effective_to
                        ? new Date(payload.effective_to)
                        : null,
                }
                : {}),
            notes: JSON.stringify(updatedMeta),
            updated_at: new Date(),
        };

        const updated = await prisma.pricing_history.update({
            where: { id },
            data: updateData,
        });

        res.status(200).json({
            success: true,
            message: "Pricing plan updated successfully",
            data: toApiPricingPlan(updated),
        });
    } catch (error) {
        next(error);
    }
};
