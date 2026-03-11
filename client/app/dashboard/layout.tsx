"use client";

import CustomerLayout from "@/components/layout/CustomerLayout";
import { CustomerProvider } from "@/features/profile/context/customer-context";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CustomerProvider>
            <CustomerLayout>{children}</CustomerLayout>
        </CustomerProvider>
    );
}
