import type { Metadata } from "next";
import { AppShell } from "../../components/AppShell";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Admin | MicroFounder Network",
  description: "Internal admin dashboard",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className={styles.adminWrapper}>
        {children}
      </div>
    </AppShell>
  );
}
