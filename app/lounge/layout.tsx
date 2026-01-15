import type { Metadata } from "next";
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
    <div className={styles.loungeWrapper}>
      {children}
    </div>
  );
}
