import { Suspense } from "react";
import { NotificationsPage } from "@/features/notifications";

export default function Page() {
    return (
        <Suspense>
            <NotificationsPage />
        </Suspense>
    );
}
