// ============================================================
// Keswani System — Seed Data
// Realistic test data for all tables
// ============================================================

// Fixed UUIDs for referential integrity
export const EMPLOYEE_IDS = {
    owner: "a0000000-0000-0000-0000-000000000001",
    admin1: "a0000000-0000-0000-0000-000000000002",
    emp1: "a0000000-0000-0000-0000-000000000003",
    emp2: "a0000000-0000-0000-0000-000000000004",
    emp3: "a0000000-0000-0000-0000-000000000005",
    owner2: "a0000000-0000-0000-0000-000000000006",
    owner3: "a0000000-0000-0000-0000-000000000007"
};

export const CLIENT_IDS = {
    c1: "b0000000-0000-0000-0000-000000000001",
    c2: "b0000000-0000-0000-0000-000000000002",
    c3: "b0000000-0000-0000-0000-000000000003",
    c4: "b0000000-0000-0000-0000-000000000004",
    c5: "b0000000-0000-0000-0000-000000000005",
    c6: "b0000000-0000-0000-0000-000000000006",
    c7: "b0000000-0000-0000-0000-000000000007",
    c8: "b0000000-0000-0000-0000-000000000008",
    c9: "b0000000-0000-0000-0000-000000000009",
    c10: "b0000000-0000-0000-0000-000000000010",
    c11: "b0000000-0000-0000-0000-000000000011",
    c12: "b0000000-0000-0000-0000-000000000012",
    c13: "b0000000-0000-0000-0000-000000000013",
    c14: "b0000000-0000-0000-0000-000000000014",
    c15: "b0000000-0000-0000-0000-000000000015",
};

export const PROPERTY_IDS = {
    p1: "c0000000-0000-0000-0000-000000000001",
    p2: "c0000000-0000-0000-0000-000000000002",
    p3: "c0000000-0000-0000-0000-000000000003",
    p4: "c0000000-0000-0000-0000-000000000004",
    p5: "c0000000-0000-0000-0000-000000000005",
    p6: "c0000000-0000-0000-0000-000000000006",
    p7: "c0000000-0000-0000-0000-000000000007",
    p8: "c0000000-0000-0000-0000-000000000008",
    p9: "c0000000-0000-0000-0000-000000000009",
    p10: "c0000000-0000-0000-0000-000000000010",
};

export const UNIT_IDS = {
    u1: "d0000000-0000-0000-0000-000000000001",
    u2: "d0000000-0000-0000-0000-000000000002",
    u3: "d0000000-0000-0000-0000-000000000003",
    u4: "d0000000-0000-0000-0000-000000000004",
    u5: "d0000000-0000-0000-0000-000000000005",
    u6: "d0000000-0000-0000-0000-000000000006",
    u7: "d0000000-0000-0000-0000-000000000007",
    u8: "d0000000-0000-0000-0000-000000000008",
    u9: "d0000000-0000-0000-0000-000000000009",
    u10: "d0000000-0000-0000-0000-000000000010",
    u11: "d0000000-0000-0000-0000-000000000011",
    u12: "d0000000-0000-0000-0000-000000000012",
    u13: "d0000000-0000-0000-0000-000000000013",
    u14: "d0000000-0000-0000-0000-000000000014",
    u15: "d0000000-0000-0000-0000-000000000015",
};

export const CONTRACT_IDS = {
    ct1: "e0000000-0000-0000-0000-000000000001",
    ct2: "e0000000-0000-0000-0000-000000000002",
    ct3: "e0000000-0000-0000-0000-000000000003",
    ct4: "e0000000-0000-0000-0000-000000000004",
    ct5: "e0000000-0000-0000-0000-000000000005",
    ct6: "e0000000-0000-0000-0000-000000000006",
    ct7: "e0000000-0000-0000-0000-000000000007",
    ct8: "e0000000-0000-0000-0000-000000000008",
    ct9: "e0000000-0000-0000-0000-000000000009",
    ct10: "e0000000-0000-0000-0000-000000000010",
    ct11: "e0000000-0000-0000-0000-000000000011",
    ct12: "e0000000-0000-0000-0000-000000000012",
};

export const SUBSCRIBER_IDS = {
    s1: "f0000000-0000-0000-0000-000000000001",
    s2: "f0000000-0000-0000-0000-000000000002",
    s3: "f0000000-0000-0000-0000-000000000003",
    s4: "f0000000-0000-0000-0000-000000000004",
    s5: "f0000000-0000-0000-0000-000000000005",
    s6: "f0000000-0000-0000-0000-000000000006",
    s7: "f0000000-0000-0000-0000-000000000007",
    s8: "f0000000-0000-0000-0000-000000000008",
    s9: "f0000000-0000-0000-0000-000000000009",
    s10: "f0000000-0000-0000-0000-000000000010",
    s11: "f0000000-0000-0000-0000-000000000011",
    s12: "f0000000-0000-0000-0000-000000000012",
    s13: "f0000000-0000-0000-0000-000000000013",
    s14: "f0000000-0000-0000-0000-000000000014",
    s15: "f0000000-0000-0000-0000-000000000015",
    s16: "f0000000-0000-0000-0000-000000000016",
    s17: "f0000000-0000-0000-0000-000000000017",
    s18: "f0000000-0000-0000-0000-000000000018",
    s19: "f0000000-0000-0000-0000-000000000019",
    s20: "f0000000-0000-0000-0000-000000000020",
};

export const METER_IDS = {
    m1: "f1000000-0000-0000-0000-000000000001",
    m2: "f1000000-0000-0000-0000-000000000002",
    m3: "f1000000-0000-0000-0000-000000000003",
    m4: "f1000000-0000-0000-0000-000000000004",
    m5: "f1000000-0000-0000-0000-000000000005",
    m6: "f1000000-0000-0000-0000-000000000006",
    m7: "f1000000-0000-0000-0000-000000000007",
    m8: "f1000000-0000-0000-0000-000000000008",
    m9: "f1000000-0000-0000-0000-000000000009",
    m10: "f1000000-0000-0000-0000-000000000010",
    m11: "f1000000-0000-0000-0000-000000000011",
    m12: "f1000000-0000-0000-0000-000000000012",
    m13: "f1000000-0000-0000-0000-000000000013",
    m14: "f1000000-0000-0000-0000-000000000014",
    m15: "f1000000-0000-0000-0000-000000000015",
    m16: "f1000000-0000-0000-0000-000000000016",
    m17: "f1000000-0000-0000-0000-000000000017",
    m18: "f1000000-0000-0000-0000-000000000018",
    m19: "f1000000-0000-0000-0000-000000000019",
    m20: "f1000000-0000-0000-0000-000000000020",
};

export const PRICING_IDS = {
    pr1: "f2000000-0000-0000-0000-000000000001",
    pr2: "f2000000-0000-0000-0000-000000000002",
    pr3: "f2000000-0000-0000-0000-000000000003",
};

// ===========================
// EMPLOYEES (5)
// ===========================
// employee - users DEFULT password for all: "Password123!" (hashed in actual DB)
export const employees = [
    {
        id: EMPLOYEE_IDS.owner,
        full_name: "Yousef Kiswani",
        email: "yousef@kiswani.lb",
        phone: "+961 3 100 001",
        address: "Beirut, Hamra Street 45",
        role: "owner" as const,
        access: { rent: true, electricity: true, expenses: true, employees: true, clients: true },
        is_active: true,
    },
    {
        id: EMPLOYEE_IDS.admin1,
        full_name: "Rami Haddad",
        email: "rami@kiswani.lb",
        phone: "+961 3 100 002",
        address: "Beirut, Achrafieh",
        role: "admin" as const,
        access: { rent: true, electricity: true, expenses: true, employees: true, clients: true },
        is_active: true,
    },
    {
        id: EMPLOYEE_IDS.emp1,
        full_name: "Hassan Nassar",
        email: "hassan@kiswani.lb",
        phone: "+961 3 100 003",
        address: "Beirut, Hamra St. Office 3",
        role: "employee" as const,
        access: { rent: true, electricity: false, expenses: false },
        is_active: true,
    },
    {
        id: EMPLOYEE_IDS.emp2,
        full_name: "Khalil Mansour",
        email: "khalil@kiswani.lb",
        phone: "+961 3 100 004",
        address: "Tripoli, Mina Road 12",
        role: "employee" as const,
        access: { rent: false, electricity: true, expenses: false },
        is_active: true,
    },
    {
        id: EMPLOYEE_IDS.emp3,
        full_name: "Samir Azar",
        email: "samir@kiswani.lb",
        phone: "+961 3 100 005",
        address: "Sidon, Old City Office",
        role: "employee" as const,
        access: { rent: true, electricity: true, expenses: true },
        is_active: false, // soft deactivated
    },
    {
        id: EMPLOYEE_IDS.owner2,
        full_name: "Mahmoud Shade",
        email: "mhmodshhade230@gmail.com",
        phone: "+961 78 833 857",
        address: "Beirut, Verdun",
        role: "owner" as const,
        access: { rent: true, electricity: true, expenses: true, employees: true, clients: true },
        is_active: true,
    },
    {
        id: EMPLOYEE_IDS.owner3,
        full_name: "Hadi Diab",
        email: "hadidiab33@gmail.com",
        phone: "+961 78 810 622",
        address: "Jounieh, Corniche Blvd",
        role: "owner" as const,
        access: { rent: true, electricity: true, expenses: true, employees: true, clients: true },
        is_active: true,
    },
];

// ===========================
// CLIENTS (15)
// ===========================
export const clients = [
    { id: CLIENT_IDS.c1, full_name: "Ali Mrad", email: "ali.mrad@mail.com", phone: "+961 71 200 001", address: "Beirut, Hamra St." },
    { id: CLIENT_IDS.c2, full_name: "Fatima Khalil", email: "fatima.k@mail.com", phone: "+961 71 200 002", address: "Tripoli, Al-Mina" },
    { id: CLIENT_IDS.c3, full_name: "Omar Suleiman", email: "omar.s@mail.com", phone: "+961 71 200 003", address: "Sidon, Old City" },
    { id: CLIENT_IDS.c4, full_name: "Layla Bakri", email: "layla.b@mail.com", phone: "+961 71 200 004", address: "Beirut, Achrafieh" },
    { id: CLIENT_IDS.c5, full_name: "Youssef Darwish", email: "youssef.d@mail.com", phone: "+961 71 200 005", address: "Jounieh, Kaslik" },
    { id: CLIENT_IDS.c6, full_name: "Nour Assaf", email: "nour.a@mail.com", phone: "+961 71 200 006", address: "Beirut, Verdun" },
    { id: CLIENT_IDS.c7, full_name: "Karim Tabbara", email: "karim.t@mail.com", phone: "+961 71 200 007", address: "Tripoli, El-Tal" },
    { id: CLIENT_IDS.c8, full_name: "Rania Zein", email: "rania.z@mail.com", phone: "+961 71 200 008", address: "Byblos, Old Souk" },
    { id: CLIENT_IDS.c9, full_name: "Bilal Hanna", email: "bilal.h@mail.com", phone: "+961 71 200 009", address: "Batroun, Main Rd" },
    { id: CLIENT_IDS.c10, full_name: "Sara Mouawad", email: "sara.m@mail.com", phone: "+961 71 200 010", address: "Beirut, Mar Mikhael" },
    { id: CLIENT_IDS.c11, full_name: "Adel Faour", email: "adel.f@mail.com", phone: "+961 71 200 011", address: "Zahle, Boulevard" },
    { id: CLIENT_IDS.c12, full_name: "Dina Khoury", email: "dina.k@mail.com", phone: "+961 71 200 012", address: "Jounieh, Harissa" },
    { id: CLIENT_IDS.c13, full_name: "Fadi Rizk", email: "fadi.r@mail.com", phone: "+961 71 200 013", address: "Sidon, Saida Center" },
    { id: CLIENT_IDS.c14, full_name: "Hiba Najjar", email: "hiba.n@mail.com", phone: "+961 71 200 014", address: "Beirut, Raouche" },
    // Soft-deleted client
    { id: CLIENT_IDS.c15, full_name: "Walid Sharif", email: "walid.s@mail.com", phone: "+961 71 200 015", address: "Tripoli, Koura", deleted_at: new Date("2025-11-01") },
];

// ===========================
// PROPERTIES (10)
// ===========================
export const properties = [
    { id: PROPERTY_IDS.p1, name: "Keswani Tower", address: "Hamra Street 45", city: "Beirut", type: "building" as const, managed_by: EMPLOYEE_IDS.emp1, owner_notes: "Main office building" },
    { id: PROPERTY_IDS.p2, name: "Al-Nour Building", address: "Mina Road 12", city: "Tripoli", type: "building" as const, managed_by: EMPLOYEE_IDS.emp1, owner_notes: "Managed by Hassan" },
    { id: PROPERTY_IDS.p3, name: "Sea View Residence", address: "Corniche Blvd 78", city: "Jounieh", type: "building" as const, managed_by: EMPLOYEE_IDS.admin1, owner_notes: "Sea-facing units" },
    { id: PROPERTY_IDS.p4, name: "Sunrise Apartments", address: "Saida Main Rd 33", city: "Sidon", type: "building" as const, managed_by: EMPLOYEE_IDS.emp2, owner_notes: "Recently renovated" },
    { id: PROPERTY_IDS.p5, name: "Cedar House", address: "Mountain View 5", city: "Byblos", type: "house" as const, managed_by: EMPLOYEE_IDS.owner, owner_notes: "Owner occupied" },
    { id: PROPERTY_IDS.p6, name: "Downtown Plaza", address: "Achrafieh Center 90", city: "Beirut", type: "commercial" as const, managed_by: EMPLOYEE_IDS.admin1, owner_notes: "Commercial retail units" },
    { id: PROPERTY_IDS.p7, name: "Valley Residence", address: "Boulevard Principale 20", city: "Zahle", type: "building" as const, managed_by: EMPLOYEE_IDS.emp1, owner_notes: "Small complex" },
    { id: PROPERTY_IDS.p8, name: "Olive Garden Villa", address: "Coastal Road 15", city: "Batroun", type: "house" as const, managed_by: EMPLOYEE_IDS.owner, owner_notes: "Vacation rental" },
    { id: PROPERTY_IDS.p9, name: "Harissa Heights", address: "Harissa Hill 8", city: "Jounieh", type: "building" as const, managed_by: EMPLOYEE_IDS.admin1, owner_notes: "Premium building" },
    { id: PROPERTY_IDS.p10, name: "Koura Land Parcel", address: "Koura District", city: "Tripoli", type: "land" as const, managed_by: EMPLOYEE_IDS.owner, owner_notes: "Land parcel" },
];

// ===========================
// UNITS (15)
// ===========================
export const units = [
    // Keswani Tower (p1) — 4 apartments
    { id: UNIT_IDS.u1, property_id: PROPERTY_IDS.p1, unit_number: "101", floor: 1, bedrooms: 2, bathrooms: 1, area_sqm: 85 },
    { id: UNIT_IDS.u2, property_id: PROPERTY_IDS.p1, unit_number: "102", floor: 1, bedrooms: 3, bathrooms: 2, area_sqm: 120 },
    { id: UNIT_IDS.u3, property_id: PROPERTY_IDS.p1, unit_number: "201", floor: 2, bedrooms: 2, bathrooms: 1, area_sqm: 85 },
    { id: UNIT_IDS.u4, property_id: PROPERTY_IDS.p1, unit_number: "202", floor: 2, bedrooms: 1, bathrooms: 1, area_sqm: 60 },
    // Al-Nour Building (p2) — 3 apartments
    { id: UNIT_IDS.u5, property_id: PROPERTY_IDS.p2, unit_number: "A1", floor: 0, bedrooms: 2, bathrooms: 1, area_sqm: 90 },
    { id: UNIT_IDS.u6, property_id: PROPERTY_IDS.p2, unit_number: "A2", floor: 0, bedrooms: 2, bathrooms: 1, area_sqm: 90 },
    { id: UNIT_IDS.u7, property_id: PROPERTY_IDS.p2, unit_number: "B1", floor: 1, bedrooms: 3, bathrooms: 2, area_sqm: 130 },
    // Sea View Residence (p3) — 3 apartments
    { id: UNIT_IDS.u8, property_id: PROPERTY_IDS.p3, unit_number: "1A", floor: 1, bedrooms: 3, bathrooms: 2, area_sqm: 140 },
    { id: UNIT_IDS.u9, property_id: PROPERTY_IDS.p3, unit_number: "1B", floor: 1, bedrooms: 2, bathrooms: 1, area_sqm: 95 },
    { id: UNIT_IDS.u10, property_id: PROPERTY_IDS.p3, unit_number: "2A", floor: 2, bedrooms: 3, bathrooms: 2, area_sqm: 140 },
    // Sunrise Apartments (p4) — 2 apartments
    { id: UNIT_IDS.u11, property_id: PROPERTY_IDS.p4, unit_number: "S1", floor: 0, bedrooms: 1, bathrooms: 1, area_sqm: 55 },
    { id: UNIT_IDS.u12, property_id: PROPERTY_IDS.p4, unit_number: "S2", floor: 1, bedrooms: 2, bathrooms: 1, area_sqm: 80 },
    // Downtown Plaza (p6) — 2 shops
    { id: UNIT_IDS.u13, property_id: PROPERTY_IDS.p6, unit_number: "Shop-1", floor: 0, bedrooms: 0, bathrooms: 1, area_sqm: 45 },
    { id: UNIT_IDS.u14, property_id: PROPERTY_IDS.p6, unit_number: "Shop-2", floor: 0, bedrooms: 0, bathrooms: 1, area_sqm: 50 },
    // Valley Residence (p7) — 1 apartment
    { id: UNIT_IDS.u15, property_id: PROPERTY_IDS.p7, unit_number: "V1", floor: 0, bedrooms: 2, bathrooms: 1, area_sqm: 100 },
];

// ===========================
// CONTRACTS (12)
// ===========================
export const contracts = [
    { id: CONTRACT_IDS.ct1, unit_id: UNIT_IDS.u1, client_id: CLIENT_IDS.c1, start_date: "2025-01-01", end_date: "2026-01-01", monthly_rent: 500, currency: "USD", deposit_amount: 500, status: "active" as const },
    { id: CONTRACT_IDS.ct2, unit_id: UNIT_IDS.u2, client_id: CLIENT_IDS.c2, start_date: "2025-02-01", end_date: "2026-02-01", monthly_rent: 700, currency: "USD", deposit_amount: 700, status: "active" as const },
    { id: CONTRACT_IDS.ct3, unit_id: UNIT_IDS.u3, client_id: CLIENT_IDS.c3, start_date: "2025-03-01", end_date: "2026-03-01", monthly_rent: 500, currency: "USD", deposit_amount: 500, status: "active" as const },
    { id: CONTRACT_IDS.ct4, unit_id: UNIT_IDS.u5, client_id: CLIENT_IDS.c4, start_date: "2025-01-15", end_date: "2026-01-15", monthly_rent: 450, currency: "USD", deposit_amount: 450, status: "active" as const },
    { id: CONTRACT_IDS.ct5, unit_id: UNIT_IDS.u6, client_id: CLIENT_IDS.c5, start_date: "2025-04-01", end_date: "2026-04-01", monthly_rent: 450, currency: "USD", deposit_amount: 450, status: "active" as const },
    { id: CONTRACT_IDS.ct6, unit_id: UNIT_IDS.u8, client_id: CLIENT_IDS.c6, start_date: "2025-01-01", end_date: "2026-01-01", monthly_rent: 900, currency: "USD", deposit_amount: 1000, status: "active" as const },
    { id: CONTRACT_IDS.ct7, unit_id: UNIT_IDS.u9, client_id: CLIENT_IDS.c7, start_date: "2025-05-01", end_date: "2026-05-01", monthly_rent: 600, currency: "USD", deposit_amount: 600, status: "active" as const },
    { id: CONTRACT_IDS.ct8, unit_id: UNIT_IDS.u11, client_id: CLIENT_IDS.c8, start_date: "2025-06-01", end_date: "2026-06-01", monthly_rent: 350, currency: "USD", deposit_amount: 350, status: "active" as const },
    { id: CONTRACT_IDS.ct9, unit_id: UNIT_IDS.u12, client_id: CLIENT_IDS.c9, start_date: "2025-03-01", end_date: "2026-03-01", monthly_rent: 400, currency: "USD", deposit_amount: 400, status: "active" as const },
    { id: CONTRACT_IDS.ct10, unit_id: UNIT_IDS.u13, client_id: CLIENT_IDS.c10, start_date: "2025-01-01", end_date: "2026-01-01", monthly_rent: 1200, currency: "USD", deposit_amount: 2000, status: "active" as const },
    { id: CONTRACT_IDS.ct11, unit_id: UNIT_IDS.u15, client_id: CLIENT_IDS.c11, start_date: "2025-02-15", end_date: "2026-02-15", monthly_rent: 550, currency: "USD", deposit_amount: 550, status: "active" as const },
    // Expired/terminated contract (soft-deleted)
    { id: CONTRACT_IDS.ct12, unit_id: UNIT_IDS.u4, client_id: CLIENT_IDS.c12, start_date: "2024-06-01", end_date: "2025-06-01", monthly_rent: 380, currency: "USD", deposit_amount: 380, status: "expired" as const, deleted_at: new Date("2025-07-01") },
];

// ===========================
// RENT PAYMENTS (30)
// ===========================
export const rentPayments = [
    // Contract 1 (c1, $500/mo) — months 1-5
    { contract_id: CONTRACT_IDS.ct1, amount: 500, payment_date: "2025-01-05", paid_at: "2025-01-05", manual_receipt_ref: "MNL-RNT-20250105-001", period_start: "2025-01-01", period_end: "2025-01-31", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct1, amount: 500, payment_date: "2025-02-03", paid_at: "2025-02-03", manual_receipt_ref: "MNL-RNT-20250203-002", period_start: "2025-02-01", period_end: "2025-02-28", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct1, amount: 500, payment_date: "2025-03-04", paid_at: "2025-03-04", manual_receipt_ref: "MNL-RNT-20250304-003", period_start: "2025-03-01", period_end: "2025-03-31", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct1, amount: 500, payment_date: "2025-04-02", paid_at: "2025-04-02", manual_receipt_ref: "MNL-RNT-20250402-004", period_start: "2025-04-01", period_end: "2025-04-30", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    { contract_id: CONTRACT_IDS.ct1, amount: 500, payment_date: "2025-05-05", paid_at: "2025-05-05", manual_receipt_ref: "MNL-RNT-20250505-005", period_start: "2025-05-01", period_end: "2025-05-31", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    // Contract 2 (c2, $700/mo) — months 2-5
    { contract_id: CONTRACT_IDS.ct2, amount: 700, payment_date: "2025-02-05", paid_at: "2025-02-05", manual_receipt_ref: "MNL-RNT-20250205-006", period_start: "2025-02-01", period_end: "2025-02-28", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct2, amount: 700, payment_date: "2025-03-03", paid_at: "2025-03-03", manual_receipt_ref: "MNL-RNT-20250303-007", period_start: "2025-03-01", period_end: "2025-03-31", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct2, amount: 700, payment_date: "2025-04-07", paid_at: "2025-04-07", manual_receipt_ref: "MNL-RNT-20250407-008", period_start: "2025-04-01", period_end: "2025-04-30", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    { contract_id: CONTRACT_IDS.ct2, amount: 350, payment_date: "2025-05-10", paid_at: "2025-05-10", manual_receipt_ref: "MNL-RNT-20250510-009", period_start: "2025-05-01", period_end: "2025-05-31", status: "partial" as const, received_by: EMPLOYEE_IDS.emp1, notes: "Partial payment — remaining due" },
    // Contract 3 (c3, $500/mo) — months 3-5
    { contract_id: CONTRACT_IDS.ct3, amount: 500, payment_date: "2025-03-05", paid_at: "2025-03-05", manual_receipt_ref: "MNL-RNT-20250305-010", period_start: "2025-03-01", period_end: "2025-03-31", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct3, amount: 500, payment_date: "2025-04-03", paid_at: "2025-04-03", manual_receipt_ref: "MNL-RNT-20250403-011", period_start: "2025-04-01", period_end: "2025-04-30", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct3, amount: 500, payment_date: "2025-05-06", paid_at: "2025-05-06", manual_receipt_ref: "MNL-RNT-20250506-012", period_start: "2025-05-01", period_end: "2025-05-31", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    // Contract 4 (c4, $450/mo) — months 1-4
    { contract_id: CONTRACT_IDS.ct4, amount: 450, payment_date: "2025-01-20", paid_at: "2025-01-20", manual_receipt_ref: "MNL-RNT-20250120-013", period_start: "2025-01-15", period_end: "2025-02-14", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct4, amount: 450, payment_date: "2025-02-18", paid_at: "2025-02-18", manual_receipt_ref: "MNL-RNT-20250218-014", period_start: "2025-02-15", period_end: "2025-03-14", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct4, amount: 450, payment_date: "2025-03-16", paid_at: "2025-03-16", manual_receipt_ref: "MNL-RNT-20250316-015", period_start: "2025-03-15", period_end: "2025-04-14", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    { contract_id: CONTRACT_IDS.ct4, amount: 450, payment_date: "2025-04-17", paid_at: "2025-04-17", manual_receipt_ref: "MNL-RNT-20250417-016", period_start: "2025-04-15", period_end: "2025-05-14", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    // Contract 6 (c6, $900/mo) — months 1-5
    { contract_id: CONTRACT_IDS.ct6, amount: 900, payment_date: "2025-01-04", paid_at: "2025-01-04", manual_receipt_ref: "MNL-RNT-20250104-017", period_start: "2025-01-01", period_end: "2025-01-31", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    { contract_id: CONTRACT_IDS.ct6, amount: 900, payment_date: "2025-02-02", paid_at: "2025-02-02", manual_receipt_ref: "MNL-RNT-20250202-018", period_start: "2025-02-01", period_end: "2025-02-28", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    { contract_id: CONTRACT_IDS.ct6, amount: 900, payment_date: "2025-03-05", paid_at: "2025-03-05", manual_receipt_ref: "MNL-RNT-20250305-019", period_start: "2025-03-01", period_end: "2025-03-31", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    { contract_id: CONTRACT_IDS.ct6, amount: 900, payment_date: "2025-04-03", paid_at: "2025-04-03", manual_receipt_ref: "MNL-RNT-20250403-020", period_start: "2025-04-01", period_end: "2025-04-30", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    { contract_id: CONTRACT_IDS.ct6, amount: 900, payment_date: "2025-05-02", paid_at: "2025-05-02", manual_receipt_ref: "MNL-RNT-20250502-021", period_start: "2025-05-01", period_end: "2025-05-31", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    // Contract 8 (c8, $350/mo) — months 6-8
    { contract_id: CONTRACT_IDS.ct8, amount: 350, payment_date: "2025-06-05", paid_at: "2025-06-05", manual_receipt_ref: "MNL-RNT-20250605-022", period_start: "2025-06-01", period_end: "2025-06-30", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct8, amount: 350, payment_date: "2025-07-04", paid_at: "2025-07-04", manual_receipt_ref: "MNL-RNT-20250704-023", period_start: "2025-07-01", period_end: "2025-07-31", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct8, amount: 350, payment_date: "2025-08-06", paid_at: null, manual_receipt_ref: null, period_start: "2025-08-01", period_end: "2025-08-31", status: "pending" as const, received_by: EMPLOYEE_IDS.emp1 },
    // Contract 10 (c10, $1200/mo shop) — months 1-4
    { contract_id: CONTRACT_IDS.ct10, amount: 1200, payment_date: "2025-01-03", paid_at: "2025-01-03", manual_receipt_ref: "MNL-RNT-20250103-024", period_start: "2025-01-01", period_end: "2025-01-31", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    { contract_id: CONTRACT_IDS.ct10, amount: 1200, payment_date: "2025-02-04", paid_at: "2025-02-04", manual_receipt_ref: "MNL-RNT-20250204-025", period_start: "2025-02-01", period_end: "2025-02-28", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    { contract_id: CONTRACT_IDS.ct10, amount: 1200, payment_date: "2025-03-03", paid_at: "2025-03-03", manual_receipt_ref: "MNL-RNT-20250303-026", period_start: "2025-03-01", period_end: "2025-03-31", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    { contract_id: CONTRACT_IDS.ct10, amount: 1200, payment_date: "2025-04-05", paid_at: "2025-04-05", manual_receipt_ref: "MNL-RNT-20250405-027", period_start: "2025-04-01", period_end: "2025-04-30", status: "paid" as const, received_by: EMPLOYEE_IDS.admin1 },
    // Contract 11 (c11, $550/mo) — months 2-3
    { contract_id: CONTRACT_IDS.ct11, amount: 550, payment_date: "2025-02-20", paid_at: "2025-02-20", manual_receipt_ref: "MNL-RNT-20250220-028", period_start: "2025-02-15", period_end: "2025-03-14", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
    { contract_id: CONTRACT_IDS.ct11, amount: 550, payment_date: "2025-03-18", paid_at: "2025-03-18", manual_receipt_ref: "MNL-RNT-20250318-029", period_start: "2025-03-15", period_end: "2025-04-14", status: "paid" as const, received_by: EMPLOYEE_IDS.emp1 },
];

// ===========================
// MAINTENANCE REQUESTS (10)
// ===========================
export const maintenanceRequests = [
    { unit_id: UNIT_IDS.u1, requested_by: CLIENT_IDS.c1, assigned_to: EMPLOYEE_IDS.emp1, title: "Leaking faucet in kitchen", description: "Kitchen faucet drips constantly", status: "completed" as const, priority: "medium" as const, estimated_cost: 50, actual_cost: 35, completed_at: new Date("2025-02-15") },
    { unit_id: UNIT_IDS.u2, requested_by: CLIENT_IDS.c2, assigned_to: EMPLOYEE_IDS.emp1, title: "AC not cooling", description: "Air conditioner blows warm air", status: "in_progress" as const, priority: "high" as const, estimated_cost: 200 },
    { unit_id: UNIT_IDS.u3, requested_by: CLIENT_IDS.c3, assigned_to: EMPLOYEE_IDS.emp2, title: "Broken window lock", description: "Bedroom window lock is broken", status: "pending" as const, priority: "low" as const, estimated_cost: 30 },
    { unit_id: UNIT_IDS.u5, requested_by: CLIENT_IDS.c4, assigned_to: EMPLOYEE_IDS.emp1, title: "Water heater malfunction", description: "No hot water", status: "completed" as const, priority: "urgent" as const, estimated_cost: 150, actual_cost: 180, completed_at: new Date("2025-03-10") },
    { unit_id: UNIT_IDS.u8, requested_by: CLIENT_IDS.c6, assigned_to: EMPLOYEE_IDS.admin1, title: "Electrical outlet sparking", description: "Living room outlet sparks when plugging", status: "completed" as const, priority: "critical" as const, estimated_cost: 100, actual_cost: 90, completed_at: new Date("2025-01-20") },
    { unit_id: UNIT_IDS.u9, requested_by: CLIENT_IDS.c7, assigned_to: EMPLOYEE_IDS.emp1, title: "Clogged drain in bathroom", description: "Bathroom drain very slow", status: "in_progress" as const, priority: "medium" as const, estimated_cost: 40 },
    { unit_id: UNIT_IDS.u11, requested_by: CLIENT_IDS.c8, assigned_to: EMPLOYEE_IDS.emp2, title: "Paint peeling on ceiling", description: "Moisture damage causing paint to peel", status: "pending" as const, priority: "low" as const, estimated_cost: 120 },
    { unit_id: UNIT_IDS.u12, requested_by: CLIENT_IDS.c9, title: "Door handle broken", description: "Front door handle came off", status: "pending" as const, priority: "medium" as const, estimated_cost: 25 },
    { unit_id: UNIT_IDS.u13, requested_by: CLIENT_IDS.c10, assigned_to: EMPLOYEE_IDS.admin1, title: "Shopfront glass cracked", description: "Large crack in shopfront window", status: "in_progress" as const, priority: "high" as const, estimated_cost: 500 },
    { unit_id: UNIT_IDS.u15, requested_by: CLIENT_IDS.c11, assigned_to: EMPLOYEE_IDS.emp1, title: "Toilet flush not working", description: "Toilet flush mechanism broken", status: "completed" as const, priority: "high" as const, estimated_cost: 60, actual_cost: 45, completed_at: new Date("2025-04-05") },
];

// ===========================
// PRICING HISTORY (3)
// ===========================
export const pricingHistory = [
    { id: PRICING_IDS.pr1, price_per_kwh: 0.10, currency: "USD", effective_from: "2024-01-01", effective_to: "2025-03-31", set_by: EMPLOYEE_IDS.owner, notes: "Initial rate" },
    { id: PRICING_IDS.pr2, price_per_kwh: 0.12, currency: "USD", effective_from: "2025-04-01", effective_to: "2025-09-30", set_by: EMPLOYEE_IDS.owner, notes: "Rate increase due to fuel costs" },
    { id: PRICING_IDS.pr3, price_per_kwh: 0.15, currency: "USD", effective_from: "2025-10-01", effective_to: null, set_by: EMPLOYEE_IDS.owner, notes: "Current rate" },
];

// ===========================
// SUBSCRIBERS (20) — using first 15 clients + some duplicates with different properties
// ===========================
export const subscribers = [
    { id: SUBSCRIBER_IDS.s1, client_id: CLIENT_IDS.c1, subscription_number: "EL-001", property_id: PROPERTY_IDS.p1, unit_id: UNIT_IDS.u1, is_active: true },
    { id: SUBSCRIBER_IDS.s2, client_id: CLIENT_IDS.c2, subscription_number: "EL-002", property_id: PROPERTY_IDS.p1, unit_id: UNIT_IDS.u2, is_active: true },
    { id: SUBSCRIBER_IDS.s3, client_id: CLIENT_IDS.c3, subscription_number: "EL-003", property_id: PROPERTY_IDS.p1, unit_id: UNIT_IDS.u3, is_active: true },
    { id: SUBSCRIBER_IDS.s4, client_id: CLIENT_IDS.c4, subscription_number: "EL-004", property_id: PROPERTY_IDS.p2, unit_id: UNIT_IDS.u5, is_active: true },
    { id: SUBSCRIBER_IDS.s5, client_id: CLIENT_IDS.c5, subscription_number: "EL-005", property_id: PROPERTY_IDS.p2, unit_id: UNIT_IDS.u6, is_active: true },
    { id: SUBSCRIBER_IDS.s6, client_id: CLIENT_IDS.c6, subscription_number: "EL-006", property_id: PROPERTY_IDS.p3, unit_id: UNIT_IDS.u8, is_active: true },
    { id: SUBSCRIBER_IDS.s7, client_id: CLIENT_IDS.c7, subscription_number: "EL-007", property_id: PROPERTY_IDS.p3, unit_id: UNIT_IDS.u9, is_active: true },
    { id: SUBSCRIBER_IDS.s8, client_id: CLIENT_IDS.c8, subscription_number: "EL-008", property_id: PROPERTY_IDS.p4, unit_id: UNIT_IDS.u11, is_active: true },
    { id: SUBSCRIBER_IDS.s9, client_id: CLIENT_IDS.c9, subscription_number: "EL-009", property_id: PROPERTY_IDS.p4, unit_id: UNIT_IDS.u12, is_active: true },
    { id: SUBSCRIBER_IDS.s10, client_id: CLIENT_IDS.c10, subscription_number: "EL-010", property_id: PROPERTY_IDS.p6, unit_id: UNIT_IDS.u13, is_active: true },
    { id: SUBSCRIBER_IDS.s11, client_id: CLIENT_IDS.c11, subscription_number: "EL-011", property_id: PROPERTY_IDS.p7, unit_id: UNIT_IDS.u15, is_active: true },
    { id: SUBSCRIBER_IDS.s12, client_id: CLIENT_IDS.c12, subscription_number: "EL-012", property_id: PROPERTY_IDS.p3, is_active: true },
    { id: SUBSCRIBER_IDS.s13, client_id: CLIENT_IDS.c13, subscription_number: "EL-013", property_id: PROPERTY_IDS.p4, is_active: true },
    { id: SUBSCRIBER_IDS.s14, client_id: CLIENT_IDS.c14, subscription_number: "EL-014", property_id: PROPERTY_IDS.p1, is_active: true },
    { id: SUBSCRIBER_IDS.s15, client_id: CLIENT_IDS.c1, subscription_number: "EL-015", property_id: PROPERTY_IDS.p6, is_active: true, notes: "Second subscription for shop" },
    { id: SUBSCRIBER_IDS.s16, client_id: CLIENT_IDS.c2, subscription_number: "EL-016", property_id: PROPERTY_IDS.p7, is_active: true },
    { id: SUBSCRIBER_IDS.s17, client_id: CLIENT_IDS.c3, subscription_number: "EL-017", property_id: PROPERTY_IDS.p9, is_active: true },
    { id: SUBSCRIBER_IDS.s18, client_id: CLIENT_IDS.c4, subscription_number: "EL-018", property_id: PROPERTY_IDS.p9, is_active: true },
    { id: SUBSCRIBER_IDS.s19, client_id: CLIENT_IDS.c5, subscription_number: "EL-019", property_id: PROPERTY_IDS.p9, is_active: true },
    // Soft-deleted subscriber
    { id: SUBSCRIBER_IDS.s20, client_id: CLIENT_IDS.c15, subscription_number: "EL-020", property_id: PROPERTY_IDS.p2, is_active: false, deleted_at: new Date("2025-11-01") },
];

// ===========================
// METERS (20) — 1 per subscriber
// ===========================
export const meters = Array.from({ length: 20 }, (_, i) => ({
    id: Object.values(METER_IDS)[i],
    subscriber_id: Object.values(SUBSCRIBER_IDS)[i],
    meter_number: `MTR-${String(i + 1).padStart(4, "0")}`,
    meter_type: (i < 15 ? "residential" : "commercial") as "residential" | "commercial",
    installation_date: `2024-0${Math.min(i + 1, 9)}-15`,
    is_active: i < 19,
    ...(i === 19 ? { deleted_at: new Date("2025-11-01") } : {}),
}));

// ===========================
// READINGS (60) — 3 readings per meter for first 20 meters
// ===========================
function generateReadings() {
    const readings: Array<{
        meter_id: string;
        reading_value: number;
        reading_date: string;
        recorded_by: string;
        source: "manual";
    }> = [];

    const meterIds = Object.values(METER_IDS).slice(0, 20);

    for (let i = 0; i < meterIds.length; i++) {
        const baseValue = 1000 + i * 50; // Each meter starts at a different base
        // Reading 1: Jan 2025
        readings.push({
            meter_id: meterIds[i],
            reading_value: baseValue,
            reading_date: "2025-01-15",
            recorded_by: EMPLOYEE_IDS.emp2,
            source: "manual" as const,
        });
        // Reading 2: Feb 2025
        readings.push({
            meter_id: meterIds[i],
            reading_value: baseValue + 120 + Math.floor(i * 5),
            reading_date: "2025-02-15",
            recorded_by: EMPLOYEE_IDS.emp2,
            source: "manual" as const,
        });
        // Reading 3: Mar 2025
        readings.push({
            meter_id: meterIds[i],
            reading_value: baseValue + 250 + Math.floor(i * 10),
            reading_date: "2025-03-15",
            recorded_by: EMPLOYEE_IDS.emp2,
            source: "manual" as const,
        });
    }
    return readings;
}

export const readings = generateReadings();

// ===========================
// BILLS (40) — 2 bills per first 20 meters
// ===========================
function generateBills() {
    const bills: Array<{
        meter_id: string;
        subscriber_id: string;
        billing_period_start: string;
        billing_period_end: string;
        previous_reading: number;
        current_reading: number;
        consumption_kwh: number;
        price_per_kwh: number;
        total_amount: number;
        currency: string;
        status: "paid" | "pending" | "partial" | "overdue";
        generated_by: string;
    }> = [];

    const meterIds = Object.values(METER_IDS).slice(0, 20);
    const subscriberIds = Object.values(SUBSCRIBER_IDS).slice(0, 20);
    const priceQ1 = 0.10; // Jan-Mar rate
    const priceQ2 = 0.12; // Apr onwards

    for (let i = 0; i < 20; i++) {
        const baseValue = 1000 + i * 50;
        const consumption1 = 120 + i * 5;
        const consumption2 = 130 + i * 5;

        // Bill 1: Jan → Feb
        bills.push({
            meter_id: meterIds[i],
            subscriber_id: subscriberIds[i],
            billing_period_start: "2025-01-15",
            billing_period_end: "2025-02-14",
            previous_reading: baseValue,
            current_reading: baseValue + consumption1,
            consumption_kwh: consumption1,
            price_per_kwh: priceQ1,
            total_amount: parseFloat((consumption1 * priceQ1).toFixed(2)),
            currency: "USD",
            status: i < 15 ? "paid" : "pending",
            generated_by: EMPLOYEE_IDS.emp2,
        });

        // Bill 2: Feb → Mar
        bills.push({
            meter_id: meterIds[i],
            subscriber_id: subscriberIds[i],
            billing_period_start: "2025-02-15",
            billing_period_end: "2025-03-14",
            previous_reading: baseValue + consumption1,
            current_reading: baseValue + consumption1 + consumption2,
            consumption_kwh: consumption2,
            price_per_kwh: priceQ1,
            total_amount: parseFloat((consumption2 * priceQ1).toFixed(2)),
            currency: "USD",
            status: i < 10 ? "paid" : (i < 15 ? "partial" : "overdue"),
            generated_by: EMPLOYEE_IDS.emp2,
        });
    }
    return bills;
}

export const bills = generateBills();

// ===========================
// BILL PAYMENTS (30) — payments for paid/partial bills
// ===========================
function generateBillPayments() {
    const payments: Array<{
        bill_index: number;
        amount: number;
        currency: string;
        payment_date: string;
        status: "paid" | "pending";
        received_by: string;
    }> = [];

    // Full payments for bills 0-29 (first 15 meters, bill 1 = paid)
    for (let i = 0; i < 15; i++) {
        payments.push({
            bill_index: i * 2, // Bill 1 index
            amount: bills[i * 2].total_amount,
            currency: "USD",
            payment_date: "2025-02-20",
            status: "paid",
            received_by: EMPLOYEE_IDS.emp2,
        });
    }

    // Full payments for bills at indices 1,3,5...19 (first 10 meters, bill 2 = paid)
    for (let i = 0; i < 10; i++) {
        payments.push({
            bill_index: i * 2 + 1,
            amount: bills[i * 2 + 1].total_amount,
            currency: "USD",
            payment_date: "2025-03-20",
            status: "paid",
            received_by: EMPLOYEE_IDS.emp2,
        });
    }

    // Partial payments for bills at indices 21,23,25,27,29 (meters 11-15, bill 2 = partial)
    for (let i = 10; i < 15; i++) {
        payments.push({
            bill_index: i * 2 + 1,
            amount: parseFloat((bills[i * 2 + 1].total_amount * 0.5).toFixed(2)),
            currency: "USD",
            payment_date: "2025-03-25",
            status: "paid",
            received_by: EMPLOYEE_IDS.emp2,
        });
    }

    return payments;
}

export const billPayments = generateBillPayments();

// ===========================
// EXPENSES
// ===========================
export const expenses = [
    { category: "maintenance" as const, amount: 35, description: "Faucet repair parts — Unit 101", expense_date: "2025-02-15", property_id: PROPERTY_IDS.p1, unit_id: UNIT_IDS.u1, paid_by: EMPLOYEE_IDS.emp1 },
    { category: "maintenance" as const, amount: 180, description: "Water heater replacement — Unit A1", expense_date: "2025-03-10", property_id: PROPERTY_IDS.p2, unit_id: UNIT_IDS.u5, paid_by: EMPLOYEE_IDS.emp1 },
    { category: "maintenance" as const, amount: 90, description: "Electrical outlet repair — Unit 1A", expense_date: "2025-01-20", property_id: PROPERTY_IDS.p3, unit_id: UNIT_IDS.u8, paid_by: EMPLOYEE_IDS.admin1 },
    { category: "purchase" as const, amount: 2500, description: "New generator spare parts", expense_date: "2025-02-01", paid_by: EMPLOYEE_IDS.owner },
    { category: "utility" as const, amount: 800, description: "Diesel fuel for generators — January", expense_date: "2025-01-31", paid_by: EMPLOYEE_IDS.owner },
    { category: "utility" as const, amount: 850, description: "Diesel fuel for generators — February", expense_date: "2025-02-28", paid_by: EMPLOYEE_IDS.owner },
    { category: "salary" as const, amount: 1000, description: "Hassan Nassar salary — January", expense_date: "2025-01-30", paid_by: EMPLOYEE_IDS.owner },
    { category: "salary" as const, amount: 1000, description: "Khalil Mansour salary — January", expense_date: "2025-01-30", paid_by: EMPLOYEE_IDS.owner },
    { category: "other" as const, amount: 150, description: "Building insurance payment", expense_date: "2025-01-15", property_id: PROPERTY_IDS.p1, paid_by: EMPLOYEE_IDS.admin1 },
    { category: "maintenance" as const, amount: 45, description: "Toilet flush repair — Unit V1", expense_date: "2025-04-05", property_id: PROPERTY_IDS.p7, unit_id: UNIT_IDS.u15, paid_by: EMPLOYEE_IDS.emp1 },
];

// ===========================
// NOTIFICATIONS (8)
// ===========================
export const notifications = [
    { recipient_type: "client", recipient_id: CLIENT_IDS.c1, channel: "email" as const, section: "rent", notification_type: "late_payment", subject: "Rent Payment Reminder", body: "Dear Ali, your rent of $500 is due on Jan 1st.", status: "sent" as const, sent_at: new Date("2025-01-01"), related_entity_type: "contract", related_entity_id: CONTRACT_IDS.ct1 },
    { recipient_type: "client", recipient_id: CLIENT_IDS.c2, channel: "whatsapp" as const, section: "rent", notification_type: "late_payment", subject: "Rent Payment Reminder", body: "Dear Fatima, your rent of $700 is due on Feb 1st.", status: "sent" as const, sent_at: new Date("2025-02-01"), related_entity_type: "contract", related_entity_id: CONTRACT_IDS.ct2 },
    { recipient_type: "client", recipient_id: CLIENT_IDS.c6, channel: "email" as const, section: "rent", notification_type: "late_payment", subject: "Rent Payment Confirmation", body: "Thank you for your payment of $900 for January.", status: "sent" as const, sent_at: new Date("2025-01-04"), related_entity_type: "contract", related_entity_id: CONTRACT_IDS.ct6 },
    { recipient_type: "client", recipient_id: CLIENT_IDS.c10, channel: "in_app" as const, section: "electricity", notification_type: "unpaid_bill", subject: "Electricity Bill Ready", body: "Your electricity bill for Jan-Feb is ready. Amount: $12.00", status: "sent" as const, sent_at: new Date("2025-02-20") },
    { recipient_type: "client", recipient_id: CLIENT_IDS.c8, channel: "email" as const, section: "rent", notification_type: "maintenance", subject: "Maintenance Update", body: "Your maintenance request has been received. We will assign a technician shortly.", status: "sent" as const, sent_at: new Date("2025-04-01") },
    { recipient_type: "employee", recipient_id: EMPLOYEE_IDS.emp1, channel: "in_app" as const, section: "rent", notification_type: "maintenance", subject: "New Maintenance Request", body: "A new maintenance request has been assigned to you for Unit 101.", status: "sent" as const, sent_at: new Date("2025-02-10") },
    { recipient_type: "client", recipient_id: CLIENT_IDS.c3, channel: "whatsapp" as const, section: "rent", notification_type: "contract_ending", subject: "Rent Due Soon", body: "Dear Omar, this is a reminder that your rent is due in 3 days.", status: "pending" as const, scheduled_at: new Date("2025-06-28") },
    { recipient_type: "client", recipient_id: CLIENT_IDS.c7, channel: "email" as const, section: "electricity", notification_type: "unpaid_bill", subject: "Electricity Bill Overdue", body: "Your electricity bill is overdue. Please make payment as soon as possible.", status: "failed" as const },
];
