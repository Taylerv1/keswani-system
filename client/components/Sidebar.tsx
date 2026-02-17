"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import styles from "./Sidebar.module.css";

interface SidebarProps {
    activeItem?: string;
}

const navItems = [
    { key: "rent" as const, icon: "🏠", href: "/dashboard/rent" },
    { key: "electricity" as const, icon: "⚡", href: "/dashboard/electricity" },
    { key: "profile" as const, icon: "👤", href: "/dashboard/profile" },
    { key: "logout" as const, icon: "🚪", href: "/login" },
];

export default function Sidebar({ activeItem }: SidebarProps) {
    const { t } = useLanguage();

    return (
        <aside className={styles.sidebar}>
            {/* Brand */}
            <div className={styles.brand}>
                <span className={styles.brandIcon}>🏢</span>
                <span className={styles.brandText}>{t.common.appName}</span>
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Navigation */}
            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <a
                        key={item.key}
                        href={item.href}
                        className={`${styles.navItem} ${activeItem === item.key ? styles.navItemActive : ""
                            }`}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>
                            {t.sidebar[item.key]}
                        </span>
                    </a>
                ))}
            </nav>

            {/* Bottom Help Card */}
            <div className={styles.helpCard}>
                <div className={styles.helpIcon}>❓</div>
                <p className={styles.helpText}>Need help?</p>
            </div>
        </aside>
    );
}
