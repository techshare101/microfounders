import styles from "./page.module.css";
import InviteForm from "./components/InviteForm";

export default function Home() {
  return (
    <main className={styles.landing}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>MicroFounder Network</h1>
        <p className={styles.tagline}>A calm home for people who build.</p>
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What this is</h2>
        <p>
          MicroFounder Network is a quiet, curated home for builders working on real things.
        </p>
        <p className={styles.listProse}>
          People shipping small products.<br />
          People learning in public, but not loudly.<br />
          People who value focus over noise.
        </p>
        <p>
          It exists so you don't have to build alone —<br />
          and you don't have to pretend you're bigger than you are.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What this isn't</h2>
        <p className={styles.listProse}>
          This is not a forum.<br />
          Not a Slack.<br />
          Not a Discord.<br />
          Not a growth hack.
        </p>
        <p>
          There are no algorithms here.<br />
          No endless notifications.<br />
          No pressure to scale before you're ready.
        </p>
        <p className={styles.closing}>
          If you're looking for attention, this isn't it.<br />
          If you're looking for clarity, it might be.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Who it's for</h2>
        <p>MicroFounder Network is for:</p>
        <ul className={styles.list}>
          <li>Independent builders</li>
          <li>Solo founders and small teams</li>
          <li>People early in the journey — or choosing to stay small</li>
          <li>Builders who care about craft, not clout</li>
        </ul>
        <p className={styles.closing}>
          If you're building something real — even quietly —<br />
          you belong here.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How it works (for now)</h2>
        <p>Access is limited by design.</p>
        <p className={styles.listProse}>
          We start small.<br />
          We invite deliberately.<br />
          We grow carefully.
        </p>
        <p className={styles.closing}>
          Not to exclude —<br />
          but to protect the atmosphere.
        </p>
      </section>

      <section className={styles.ctaSection} id="request">
        <h2 className={styles.ctaTitle}>Request an invite</h2>
        <p className={styles.ctaText}>If this feels like a place you'd enter quietly:</p>
        <InviteForm />
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerText}>Curated by MetalMindTech.</p>
      </footer>
    </main>
  );
}
