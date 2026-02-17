"use client";

import React from "react";
import Sidebar from "./Sidebar";
import SecondarySidebar from "./SecondarySidebar";
import styles from "./AdminLayout.module.css";

interface AdminLayoutProps {
    children: React.ReactNode;
    activeItem?: string;
}

export default function AdminLayout({ children, activeItem }: AdminLayoutProps) {
    return (
        <div className={styles.layout}>
            <Sidebar activeItem={activeItem} />
            <SecondarySidebar />
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
