import styles from "../scent-fix.module.css";

// A neutral, illustrative bottle silhouette — deliberately not tied to any
// one of the 6 real products, since it appears before the scent matcher
// (Sections 5 and 6) runs. Pure CSS, no image request, so it never
// competes with real product photography for load priority.
export default function Bottle({ onLight = false }: { onLight?: boolean }) {
  return (
    <div
      className={`${styles.bottle} ${onLight ? styles.bottleOnLight : ""}`}
      aria-hidden="true"
    >
      <div className={styles.bottleCap} />
      <div className={styles.bottleNeck} />
      <div className={styles.bottleBody} />
    </div>
  );
}
