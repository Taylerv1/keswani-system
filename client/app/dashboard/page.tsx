"use client";

import React from "react";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
    const { t, toggleLocale } = useLanguage();

    return (
        <AdminLayout activeItem="rent">
            <div className={styles.header}>
                <h1 className={styles.title}>{t.dashboard.title}</h1>
                <button
                    className={`btn btn-outline btn-sm ${styles.langBtn}`}
                    onClick={toggleLocale}
                    type="button"
                >
                    🌐 {t.common.switchLanguage}
                </button>
            </div>

            <div className="card">
                <p>{t.dashboard.welcome}</p>
            </div>
        </AdminLayout>
    );
}
