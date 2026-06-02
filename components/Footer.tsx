export default function Footer() {
  const whatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";
  return (
    <footer className="footer">
      <div className="container">
        <p><b>House of Eon</b> — Premium perfumes with simple online checkout.</p>
        <p className="muted">Support through WhatsApp. Shipping tracking will be shared after dispatch.</p>
      </div>
      {whatsapp ? <a className="whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank">WhatsApp</a> : null}
    </footer>
  );
}
