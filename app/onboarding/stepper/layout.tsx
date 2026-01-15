import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Your Profile | MicroFounder Network",
  description: "Set up your Founder Passport",
  robots: { index: false, follow: false },
};

export default function OnboardingStepperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
