// ============================================================
// Keswani System — Database Seeder
// Run: npm run seed
// ============================================================

import {
    employees,
    clients,
    properties,
    units,
    contracts,
    rentPayments,
    maintenanceRequests,
    pricingHistory,
    subscribers,
    meters,
    readings,
    bills,
    billPayments,
    expenses,
    notifications,
} from "./seed-data";

// Use the project's Prisma singleton (avoids duplicate clients in dev)
import prisma from "../../src/config/prisma";
import { supabaseAdmin } from "../../src/config/supabase";

const DEFAULT_PASSWORD = process.env.DEFAULT_SEED_PASSWORD || "Password123!";

async function createAuthUsersForSeededProfiles() {
    const profiles: Array<{ email: string; table: "employees" | "clients"; id: string }> = [];

    for (const e of employees) profiles.push({ email: e.email, table: "employees", id: e.id });
    for (const c of clients) profiles.push({ email: c.email, table: "clients", id: c.id });

    for (const p of profiles) {
        try {
            // Skip if already linked
            const existing: any = await (prisma as any)[p.table].findUnique({ where: { id: p.id } });
            if (existing && existing.auth_user_id) {
                console.log(`    → Skipping ${p.email} (already linked)`);
                continue;
            }

            // Try to create the Supabase auth user
            const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: p.email,
                password: DEFAULT_PASSWORD,
                email_confirm: true,
            } as any);

            let userId: string | null = createData?.user?.id || null;

            if (createError || !userId) {
                // If user already exists or create failed, try to find by listing users
                console.error(`    ⚠ createUser error for ${p.email}: ${createError?.message || "unknown"}`);
                const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                if (listError) {
                    console.error("    ⚠ listUsers error:", listError.message);
                } else if (listData && Array.isArray(listData.users)) {
                    const found = listData.users.find((u: any) => u.email && u.email.toLowerCase() === p.email.toLowerCase());
                    if (found) userId = found.id;
                }
            }

            if (!userId) {
                console.error(`    ❌ Could not create/find auth user for ${p.email}`);
                continue;
            }

            // Link to profile
            await (prisma as any)[p.table].update({ where: { id: p.id }, data: { auth_user_id: userId } });
            console.log(`    ✅ Linked ${p.email} -> ${userId}`);
        } catch (err: any) {
            console.error(`    ❌ Error processing ${p.email}:`, err?.message || err);
        }
    }

    console.log(`    ✅ Auth users created/linked (default password: ${DEFAULT_PASSWORD})`);
}

async function main() {
    console.log("🌱 Starting seed...\n");

    // ---- 1. Employees ----
    console.log("  → Seeding employees...");
    for (const emp of employees) {
        await prisma.employees.upsert({
            where: { id: emp.id },
            update: {
                full_name: emp.full_name,
                email: emp.email,
                phone: emp.phone,
                address: emp.address,
                role: emp.role,
                access: emp.access,
                is_active: emp.is_active,
            },
            create: {
                id: emp.id,
                full_name: emp.full_name,
                email: emp.email,
                phone: emp.phone,
                address: emp.address,
                role: emp.role,
                access: emp.access,
                is_active: emp.is_active,
            },
        });
    }
    console.log(`    ✅ ${employees.length} employees`);

    // ---- 2. Clients ----
    console.log("  → Seeding clients...");
    for (const cli of clients) {
        await prisma.clients.upsert({
            where: { id: cli.id },
            update: {},
            create: {
                id: cli.id,
                full_name: cli.full_name,
                email: cli.email,
                phone: cli.phone,
                address: cli.address,
                deleted_at: (cli as any).deleted_at || null,
            },
        });
    }
    console.log(`    ✅ ${clients.length} clients`);

    // ---- Create/link Supabase auth users for employees & clients ----
    console.log("  → Creating Supabase auth users for seeded employees and clients...");
    await createAuthUsersForSeededProfiles();

    // ---- 3. Properties ----
    console.log("  → Seeding properties...");
    for (const prop of properties) {
        await prisma.properties.upsert({
            where: { id: prop.id },
            update: ({
                name: prop.name,
                address: prop.address,
                city: prop.city,
                type: prop.type,
                is_for_rent: (prop as any).is_for_rent ?? true,
                is_for_electricity: (prop as any).is_for_electricity ?? true,
                managed_by: prop.managed_by,
                owner_notes: (prop as any).owner_notes ?? null,
            } as any),
            create: ({
                id: prop.id,
                name: prop.name,
                address: prop.address,
                city: prop.city,
                type: prop.type,
                is_for_rent: (prop as any).is_for_rent ?? true,
                is_for_electricity: (prop as any).is_for_electricity ?? true,
                managed_by: prop.managed_by,
                owner_notes: (prop as any).owner_notes ?? null,
            } as any),
        });
    }
    console.log(`    ✅ ${properties.length} properties`);

    // ---- 4. Units ----
    console.log("  → Seeding units...");
    for (const unit of units) {
        await prisma.units.upsert({
            where: { id: unit.id },
            update: {},
            create: {
                id: unit.id,
                property_id: unit.property_id,
                unit_number: unit.unit_number,
                floor: unit.floor,
                bedrooms: unit.bedrooms,
                bathrooms: unit.bathrooms,
                area_sqm: unit.area_sqm,
            },
        });
    }
    console.log(`    ✅ ${units.length} units`);

    // ---- 5. Contracts ----
    console.log("  → Seeding contracts...");
    for (const ct of contracts) {
        await prisma.contracts.upsert({
            where: { id: ct.id },
            update: {},
            create: {
                id: ct.id,
                unit_id: ct.unit_id,
                client_id: ct.client_id,
                start_date: new Date(ct.start_date),
                end_date: ct.end_date ? new Date(ct.end_date) : null,
                monthly_rent: ct.monthly_rent,
                currency: ct.currency,
                deposit_amount: ct.deposit_amount,
                status: ct.status,
                deleted_at: (ct as any).deleted_at || null,
            },
        });
    }
    console.log(`    ✅ ${contracts.length} contracts`);

    // ---- 6. Rent Payments ----
    console.log("  → Seeding rent payments...");
    for (const rp of rentPayments) {
        await prisma.rent_payments.create({
            data: {
                contract_id: rp.contract_id,
                amount: rp.amount,
                currency: "USD",
                payment_date: new Date(rp.payment_date),
                period_start: rp.period_start ? new Date(rp.period_start) : null,
                period_end: rp.period_end ? new Date(rp.period_end) : null,
                payment_method: "cash",
                status: rp.status,
                received_by: rp.received_by,
                paid_at: rp.paid_at ? new Date(rp.paid_at) : null,
                notes: rp.notes || null,
            },
        });
    }
    console.log(`    ✅ ${rentPayments.length} rent payments`);

    // ---- 7. Maintenance Requests ----
    console.log("  → Seeding maintenance requests...");
    for (const mr of maintenanceRequests) {
        await prisma.maintenance_requests.create({
            data: {
                unit_id: mr.unit_id,
                requested_by: mr.requested_by,
                assigned_to: (mr as any).assigned_to || null,
                title: mr.title,
                description: mr.description,
                status: mr.status,
                priority: mr.priority,
                estimated_cost: mr.estimated_cost,
                actual_cost: (mr as any).actual_cost || null,
                completed_at: (mr as any).completed_at || null,
            },
        });
    }
    console.log(`    ✅ ${maintenanceRequests.length} maintenance requests`);

    // ---- 8. Pricing History ----
    console.log("  → Seeding pricing history...");
    for (const ph of pricingHistory) {
        await prisma.pricing_history.upsert({
            where: { id: ph.id },
            update: {},
            create: {
                id: ph.id,
                price_per_kwh: ph.price_per_kwh,
                currency: ph.currency,
                effective_from: new Date(ph.effective_from),
                effective_to: ph.effective_to ? new Date(ph.effective_to) : null,
                set_by: ph.set_by,
                notes: ph.notes,
            },
        });
    }
    console.log(`    ✅ ${pricingHistory.length} pricing records`);

    // ---- 9. Subscribers ----
    console.log("  → Seeding subscribers...");
    for (const sub of subscribers) {
        await prisma.subscribers.upsert({
            where: { id: sub.id },
            update: {},
            create: {
                id: sub.id,
                client_id: sub.client_id,
                subscription_number: sub.subscription_number,
                property_id: sub.property_id,
                unit_id: (sub as any).unit_id || null,
                is_active: sub.is_active,
                notes: (sub as any).notes || null,
                deleted_at: (sub as any).deleted_at || null,
            },
        });
    }
    console.log(`    ✅ ${subscribers.length} subscribers`);

    // ---- 10. Meters ----
    console.log("  → Seeding meters...");
    for (const meter of meters) {
        await prisma.meters.upsert({
            where: { id: meter.id },
            update: {},
            create: {
                id: meter.id,
                subscriber_id: meter.subscriber_id,
                meter_number: meter.meter_number,
                meter_type: meter.meter_type,
                installation_date: new Date(meter.installation_date),
                is_active: meter.is_active,
                deleted_at: (meter as any).deleted_at || null,
            },
        });
    }
    console.log(`    ✅ ${meters.length} meters`);

    // ---- 11. Readings ----
    console.log("  → Seeding readings...");
    // Use createMany with skipDuplicates to avoid failing when seed is re-run
    await prisma.readings.createMany({
        data: readings.map((rd) => ({
            meter_id: rd.meter_id,
            reading_value: rd.reading_value,
            reading_date: new Date(rd.reading_date),
            recorded_by: rd.recorded_by,
            source: rd.source,
        })),
        skipDuplicates: true,
    });
    console.log(`    ✅ ${readings.length} readings (skipped duplicates)`);

    // ---- 12. Bills ----
    console.log("  → Seeding bills...");
    const createdBills: string[] = [];
    for (const bill of bills) {
        const created = await prisma.bills.create({
            data: {
                meter_id: bill.meter_id,
                subscriber_id: bill.subscriber_id,
                billing_period_start: new Date(bill.billing_period_start),
                billing_period_end: new Date(bill.billing_period_end),
                previous_reading: bill.previous_reading,
                current_reading: bill.current_reading,
                consumption_kwh: bill.consumption_kwh,
                price_per_kwh: bill.price_per_kwh,
                total_amount: bill.total_amount,
                currency: bill.currency,
                status: bill.status,
                generated_by: bill.generated_by,
            },
        });
        createdBills.push(created.id);
    }
    console.log(`    ✅ ${bills.length} bills`);

    // ---- 13. Bill Payments ----
    console.log("  → Seeding bill payments...");
    for (const bp of billPayments) {
        await prisma.bill_payments.create({
            data: {
                bill_id: createdBills[bp.bill_index],
                amount: bp.amount,
                currency: bp.currency,
                payment_date: new Date(bp.payment_date),
                payment_method: "cash",
                status: bp.status,
                received_by: bp.received_by,
            },
        });
    }
    console.log(`    ✅ ${billPayments.length} bill payments`);

    // ---- 14. Expenses ----
    console.log("  → Seeding expenses...");
    for (const exp of expenses) {
        await prisma.expenses.create({
            data: {
                category: exp.category,
                amount: exp.amount,
                currency: "USD",
                description: exp.description,
                expense_date: new Date(exp.expense_date),
                property_id: (exp as any).property_id || null,
                unit_id: (exp as any).unit_id || null,
                paid_by: exp.paid_by,
            },
        });
    }
    console.log(`    ✅ ${expenses.length} expenses`);

    // ---- 15. Notifications ----
    console.log("  → Seeding notifications...");
    for (const notif of notifications) {
        await prisma.notifications.create({
            data: {
                recipient_type: notif.recipient_type,
                recipient_id: notif.recipient_id,
                channel: notif.channel,
                subject: notif.subject,
                body: notif.body,
                status: notif.status,
                sent_at: (notif as any).sent_at || null,
                scheduled_at: (notif as any).scheduled_at || null,
                related_entity_type: (notif as any).related_entity_type || null,
                related_entity_id: (notif as any).related_entity_id || null,
            },
        });
    }
    console.log(`    ✅ ${notifications.length} notifications`);

    console.log("\n🎉 Seed completed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
