import Link from "next/link";
export default function NotFound() {
  return (
    <main className="form-panel">
      <h1>404</h1>
      <p>Бет табылмады · Страница не найдена</p>
      <Link href="/feed">Лента →</Link>
    </main>
  );
}
