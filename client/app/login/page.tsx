"use client";

import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import styles from "./login.module.css";

export default function LoginPage() {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // No backend logic — placeholder only
    };

    return (
        <div className={styles.container}>
            {/* Left: Login Form */}
            <div className={styles.formSide}>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <h1 className={styles.title}>{t.login.welcome}</h1>
                    <p className={styles.subtitle}>{t.login.subtitle}</p>

                    <div className="form-group">
                        <label className="form-label" htmlFor="login-email">
                            {t.login.email}
                        </label>
                        <input
                            id="login-email"
                            className="form-input"
                            type="email"
                            placeholder={t.login.emailPlaceholder}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="login-password">
                            {t.login.password}
                        </label>
                        <input
                            id="login-password"
                            className="form-input"
                            type="password"
                            placeholder={t.login.passwordPlaceholder}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>

                    <div className={styles.rememberRow}>
                        <div
                            className="toggle-wrapper"
                            onClick={() => setRememberMe(!rememberMe)}
                            role="switch"
                            aria-checked={rememberMe}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") setRememberMe(!rememberMe);
                            }}
                        >
                            <div className={`toggle-track ${rememberMe ? "active" : ""}`}>
                                <div className="toggle-thumb" />
                            </div>
                            <span className="toggle-label">{t.login.rememberMe}</span>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">
                        {t.login.signIn}
                    </button>

                    <p className={styles.signUpText}>
                        {t.login.noAccount}{" "}
                        <a href="#" className={styles.signUpLink}>
                            {t.login.signUp}
                        </a>
                    </p>
                </form>
            </div>

            {/* Right: Branded Gradient Panel */}
            <div className={styles.brandSide}>
                <div className={styles.brandContent}>
                    <div className={styles.brandLogo}>🏢</div>
                    <h2 className={styles.brandTitle}>Keswani</h2>
                </div>
            </div>
        </div>
    );
}
