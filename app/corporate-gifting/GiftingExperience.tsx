"use client";

import { useRef, useState, type FormEvent } from "react";
import s from "./gifting.module.css";
import { useGiftPersonalisation } from "./GiftPersonalisation";

export function GiftBox() {
  const [open, setOpen] = useState(false);
  return <div className={s.scene}>
    <div className={s.orbit} aria-hidden="true" />
    <div className={`${s.box} ${open ? s.open : ""}`} aria-hidden="true">
      <div className={s.boxInside}>
        {["DESERT TONKA", "ARCTIC WAVE", "SILENT GOLD"].map((name, i) => <div className={s.vial} key={name} style={{ "--i": i } as React.CSSProperties}><div className={s.cap} /><div className={s.vialLabel}><span>HOUSE<br />OF EON</span><small>{name}</small><i>8 ml</i></div></div>)}
      </div>
      <div className={s.boxFront}><span>THE DISCOVERY COLLECTION</span><small>THREE SCENTS. A PERSONAL DISCOVERY.</small></div>
      <div className={s.lid}><span className={s.lidMonogram}>E</span><strong>HOUSE OF EON</strong><span>THE ART OF GIVING</span><div className={s.ribbon} /></div>
    </div>
    <div className={s.sceneCaption}><button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Close the gift" : "Unwrap the experience"} <span aria-hidden="true">{open ? "−" : "+"}</span></button><small>Gift presentation concept · final packaging confirmed with your quote</small></div>
  </div>;
}

export function EnquiryForm() {
  const gift = useGiftPersonalisation();
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const requestId = useRef("");
  const previousPayload = useRef("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const form = new FormData(event.currentTarget);
    const fields = { ...Object.fromEntries(form.entries()), ...(gift.applied ? { giftMessage: gift.giftMessage, fragrances: gift.fragrances } : {}) };
    const fingerprint = JSON.stringify(fields);
    if (!requestId.current || previousPayload.current !== fingerprint) requestId.current = crypto.randomUUID();
    previousPayload.current = fingerprint;
    setState("sending"); setError("");
    try {
      const response = await fetch("/api/corporate-gifting", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, consent: form.get("consent") === "on", requestId: requestId.current }), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to send. Please try again.");
      setState("success");
    } catch (e) { setError(e instanceof Error && e.name !== "TimeoutError" ? e.message : "Sending took longer than expected. Please retry; your enquiry reference will stay the same."); setState("error"); }
  }
  if (state === "success") return <div className={s.success} role="status"><span className={s.successMark}>✓</span><p className={s.eyebrow}>A thoughtful beginning</p><h3>Your gifting brief is on its way.</h3><p>Thank you. Our team will review your requirements and contact you using the details you shared to discuss your gift sets and quotation.</p><a href="mailto:orders@houseofeon.in">orders@houseofeon.in ↗</a><button className={s.secondary} onClick={() => { requestId.current = ""; setState("idle"); }}>Send another enquiry</button></div>;
  return <form className={s.form} onSubmit={submit} aria-label="Corporate gifting enquiry" aria-busy={state === "sending"}>
    <div className={s.formIntro}><span>YOUR GIFTING BRIEF</span><small>* Required fields</small></div>
    {gift.applied && <div className={s.briefPreview}><strong>Your personalised gift concept</strong><p>{gift.fragrances.join(" · ")}</p><label>Message on your gift card<textarea maxLength={140} rows={2} value={gift.giftMessage} onChange={e=>gift.setGiftMessage(e.target.value)} /></label><a href="#personalise">Edit fragrance choices ↗</a></div>}
    <div className={s.fields}>
      <label>Your name *<input name="name" required maxLength={100} autoComplete="name" placeholder="Full name" /></label>
      <label>Company *<input name="company" required maxLength={100} value={gift.company} onChange={e=>gift.setCompany(e.target.value)} autoComplete="organization" placeholder="Company or organisation" /></label>
      <label>Email address *<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@company.com" /></label>
      <label>Phone number *<input name="phone" type="tel" required minLength={7} maxLength={24} autoComplete="tel" placeholder="+91" /></label>
      <label>Number of gift sets *<input name="quantity" type="number" min={1} max={100000} required placeholder="e.g. 50" /></label>
      <label>Budget per gift<select name="budget" defaultValue="Not decided">{["Not decided", "Under ₹500", "₹500–₹1,000", "₹1,000–₹1,500", "Above ₹1,500"].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>What’s the occasion?<select name="occasion">{["Employee appreciation", "Diwali & festive gifting", "Client gifting", "Welcome kits", "Events & other"].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Preferred delivery date<input name="date" type="date" /></label>
      <label className={s.full}>Delivery location(s) *<input name="delivery" required maxLength={200} placeholder="City / PIN code, or multiple locations" /></label>
      <label className={s.full}>Make it yours<select name="branding">{["Explore the options", "Company message card", "Branded sleeve / packaging", "Standard Discovery Set"].map(v => <option key={v}>{v}</option>)}</select></label>
      <label className={s.full}>Anything else we should know?<textarea name="message" maxLength={2000} rows={3} placeholder="Your idea, scent preferences, sample request or delivery details…" /></label>
    </div>
    <div className={s.honey} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <label className={s.consent}><input type="checkbox" name="consent" required /><span>I agree to be contacted by House of Eon about this gifting enquiry. *</span></label>
    <p className={s.privacy}>Your details are used to respond to this enquiry and prepare your quotation.</p>
    {error && <p className={s.error} role="alert">{error} <a href="mailto:orders@houseofeon.in">Email our team ↗</a></p>}
    <button className={s.primary} disabled={state === "sending"} type="submit">{state === "sending" ? "Sending your brief…" : "Request my gifting proposal"}<span aria-hidden="true">↗</span></button>
    <p className={s.formNote}>An enquiry, with no payment or commitment. Pricing, personalisation and delivery are confirmed in your quotation.</p>
  </form>;
}
