"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="form-panel">
      <h1>Қате · Ошибка</h1>
      <button onClick={reset}>Қайталау · Повторить</button>
    </main>
  );
}
