"use client";

import { CSSProperties, ReactNode } from "react";
import { User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { useTranslation } from "@/lib/translation-context";

interface ProfileInfoCardProps {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export default function ProfileInfoCard({ fullName, email, phone, address, createdAt }: ProfileInfoCardProps) {
  const { t, dir: currentDir } = useTranslation();

  const fields: {
    icon: ReactNode;
    label: string;
    value: string;
    color: string;
    bg: string;
    className?: string;
    dir?: string;
    style?: CSSProperties;
  }[] = [
    { icon: <User size={16} />, label: t("fullName"), value: fullName, color: "text-card-blue", bg: "bg-card-blue-light" },
    {
      icon: <Phone size={16} />,
      label: t("phoneNumber"),
      value: phone,
      color: "text-card-green",
      bg: "bg-card-green-light",
      className: undefined,
      dir: "ltr",
      style: { textAlign: currentDir === "rtl" ? "right" : "left"  },
    },
    { icon: <Mail size={16} />, label: t("emailAddress"), value: email, color: "text-card-orange", bg: "bg-card-orange-light" },
    { icon: <MapPin size={16} />, label: t("addressLabel"), value: address, color: "text-card-red", bg: "bg-card-red-light" },
    { icon: <Calendar size={16} />, label: t("accountCreated"), value: createdAt, color: "text-card-green", bg: "bg-card-green-light" },
  ];

  return (
    <div className="bg-surface rounded-2xl border border-surface-border p-6">
      <h2 className="text-base font-semibold text-text-primary mb-5">{t("personalInfo")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div
            key={f.label}
            className="group flex items-start gap-3.5 p-3.5 rounded-xl bg-background hover:bg-primary-light/40 transition-colors duration-200"
          >
            <div className={`w-9 h-9 rounded-xl ${f.bg} ${f.color} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110`}>
              {f.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-muted">{f.label}</p>
              <p
                className={`text-sm font-medium text-text-primary mt-0.5 truncate ${f.className || ""}`}
                dir={f.dir}
                style={f.style}
              >
                {f.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
