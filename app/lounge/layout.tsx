import type { Metadata } from "next";
import { AppShell } from "../../components/AppShell";
import styles from "./lounge.module.css";

export const metadata: Metadata = {
  title: "Lounge | MicroFounder Network",
  description: "Your calm home for building",
  robots: { index: false, follow: false },
};

export default function LoungeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className={styles.loungeWrapper}>
        {children}
      </div>
    </AppShell>
  );
}
