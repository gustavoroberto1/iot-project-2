"use client";

import { DeviceDoc, fetchStates } from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import DeviceCard from "../components/card";
import styles from "../styles/styles.module.css";

export default function Page() {
  const [items, setItems] = useState<DeviceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const rows = await fetchStates();
      setItems(rows);
    } catch (e: Error | unknown) {
      setError((e as Error)?.message || "erro ao buscar estados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, [load]);

  const connClass = useMemo(() => {
    if (error) return `${styles.conn} ${styles.connErr}`;
    if (!loading) return `${styles.conn} ${styles.connOk}`;
    return styles.conn;
  }, [loading, error]);

  return (
    <main className={`${styles.container} ${styles.card}`}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>🧪 Device Dashboard</h2>
        <div className={connClass}>
          {error ? "❌ Erro" : loading ? "… carregando" : "✅ OK"}
        </div>
      </div>

      <div className={styles.footer}>
        API: <code>{process.env.NEXT_PUBLIC_API_URL || "http://localhost:1880"}</code>
      </div>

      <div className={styles.grid}>
        {items.map((doc) => (
          <DeviceCard key={doc.device_id} doc={doc} onRefresh={load} />
        ))}
      </div>

      {items.length === 0 && !loading && !error && (
        <div className={styles.meta}>Nenhum dispositivo encontrado.</div>
      )}
      {error && <div className={styles.meta}>Erro: {error}</div>}
    </main>
  );
}
