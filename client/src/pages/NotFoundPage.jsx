import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 pt-16" dir="rtl">
      <section className="w-full max-w-md rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center shadow-lg">
        <p className="mb-2 text-6xl font-black text-primary">404</p>
        <h1 className="mb-3 text-2xl font-black text-on-surface">העמוד לא נמצא</h1>
        <p className="mb-6 text-on-surface-variant">ייתכן שהקישור שגוי או שהעמוד הועבר.</p>
        <Link to="/" className="inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary/90">
          חזרה לדף הבית
        </Link>
      </section>
    </main>
  );
}
