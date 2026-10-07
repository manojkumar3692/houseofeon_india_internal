"use client";
import { useRef, useState } from "react";
import styles from "./RivaWaitlist.module.css";

export default function RivaWaitlistForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const fields = new FormData(event.currentTarget);
    inFlight.current = true;
    setStatus("sending"); setError("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fields.get("email"), consent: fields.get("consent") === "on", website: fields.get("website"), product: "riva" }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Please try again.");
      setStatus("success");
    } catch (error) {
      setError(error instanceof Error && error.name !== "TimeoutError" ? error.message : "The request timed out. Please try again.");
      setStatus("error");
    } finally { inFlight.current = false; }
  }
  return <div id="riva-waitlist" className={styles.form}>
    <h2>Be first to hear about RIVA.</h2>
    {status === "success" ? <p role="status">You’re on the RIVA waitlist. We’ll email you when it launches.</p> : <form onSubmit={submit} aria-busy={status === "sending"}>
      <p className={styles.note}>Leave your email for launch news. Joining is free and does not reserve a bottle or place an order.</p>
      <label htmlFor="riva-email">Email address</label>
      <input id="riva-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} disabled={status === "sending"} />
      <div className={styles.trap} aria-hidden="true"><label htmlFor="riva-website">Website</label><input id="riva-website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <label className={styles.consent}><input type="checkbox" name="consent" required disabled={status === "sending"} /><span>I agree to receive emails from House of Eon about the RIVA launch. I can ask to be removed at any time.</span></label>
      <button className="btn" type="submit" disabled={status === "sending"}>{status === "sending" ? "Joining…" : "Join the waitlist"}</button>
      {status === "error" && <p role="alert" className={styles.error}>{error} You can also <a href="mailto:orders@houseofeon.in?subject=RIVA%20waitlist">email us directly</a>.</p>}
    </form>}
  </div>;
}
