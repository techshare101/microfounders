"use client";

import styles from "./page.module.css";
import InviteForm from "./components/InviteForm";
import { useParallax } from "./components/useParallax";

export default function ReceivingChamber() {
  const parallax = useParallax(14, 22);

  return (
    <main className={styles.chamber}>
      {/* HERO */}
      <section
        className={styles.hero}
        style={{ transform: `translateY(${parallax}px)` }}
      >
        <div className={styles.monogram}>
          <img
            src="/brand/MF-monogram.svg"
            alt="MicroFounder Network"
            width={64}
            height={64}
            className="mf-monogram-enter"
          />
        </div>

        <h1 className={styles.heroTitle}>MicroFounder Network</h1>
        <p className={styles.tagline}>A private lounge for people who build.</p>

        <div className={styles.goldDivider} />
      </section>

      {/* INTENT STATEMENT */}
      <section className={styles.intentSection}>
        <p className={styles.contrast}>
          Not a feed.<br />
          Not a hustle space.<br />
          Not a place to perform.
        </p>
        <p className={styles.promise}>
          A place to think clearly, build deliberately,<br />
          and meet others doing the same.
        </p>
      </section>

      {/* CONTENT SECTIONS */}
      <div className={styles.contentSections}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What this is</h2>
          <p>
            MicroFounder Network is a quiet, curated home for builders working on
            real things — without needing to shout, posture, or pretend.
          </p>
          <ul className={styles.list}>
            <li>People shipping small products</li>
            <li>People learning in public — quietly</li>
            <li>People who value focus over noise</li>
          </ul>
          <p>
            It exists so you don't have to build alone — and so you don't have to
            pretend you're bigger than you are.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Who it's for</h2>
          <ul className={styles.list}>
            <li>Independent builders</li>
            <li>Solo founders and tiny teams</li>
            <li>Those choosing clarity over noise</li>
            <li>Builders who care about craft, not clout</li>
          </ul>
          <p className={styles.closing}>
            If you're building something real — even quietly — you belong here.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <p>Access is limited by design.</p>
          <p className={styles.listProse}>
            We start small.<br />
            We invite deliberately.<br />
            We grow carefully.
          </p>
          <p className={styles.closing}>
            Not to exclude — but to protect the atmosphere.
          </p>
        </section>
      </div>

      {/* WAITLIST FORM */}
      <section className={styles.ctaSection} id="request">
        <h2 className={styles.ctaTitle}>Request an invite</h2>
        <p className={styles.ctaText}>If this feels like a place you'd enter quietly:</p>
        <InviteForm />
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>Curated by MetalMindTech.</p>
      </footer>
    </main>
  );
}
