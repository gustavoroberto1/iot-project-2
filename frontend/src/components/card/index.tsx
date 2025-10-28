"use client";

import { DeviceDoc, LedState, setLed } from "@/lib/api";
import { useMemo, useState } from "react";
import styles from "../../styles/styles.module.css";

export default function DeviceCard({
  doc,
  onRefresh,
}: {
  doc: DeviceDoc;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState<null | "led1" | "led2" | "led3">(null);

  const isOn = (k: "led1"|"led2"|"led3") =>
    (doc.state?.[k] ?? "off") === "on";

  const lastUpdated = useMemo(() => {
    const ts = doc.state?.last_updated || doc.update_at || doc.created_at;
    return ts ? new Date(ts).toLocaleString() : "—";
  }, [doc]);

  async function toggle(k: "led1"|"led2"|"led3") {
    try {
      setBusy(k);
      const next: LedState = isOn(k) ? "off" : "on";
      await setLed(doc.device_id, k, next);
      onRefresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={styles.device}>
      <div className={styles.deviceHead}>
        <div className={styles.deviceTitle}>{doc.device_id}</div>
        <span className={styles.pill}>
          {(isOn("led1") ? "●" : "○")} {(isOn("led2") ? "●" : "○")} {(isOn("led3") ? "●" : "○")}
        </span>
      </div>

      <div className={styles.btnRow} style={{marginBottom: 8}}>
        {doc.model && <span className={styles.pill}>Model:  {doc.model}</span>}
        {doc.ip_address && <span className={styles.pill}>IP: {doc.ip_address}</span>}
        {doc.mac_address && <span className={styles.pill}>MAC: {doc.mac_address}</span>}
        {doc.location && <span className={styles.pill}>Location: {doc.location}</span>}
      </div>

      <div className={styles.ledGrid}>
        {(["led1","led2","led3"] as const).map((k) => (
          <div key={k} className={styles.lampCard}>
            <div className={styles.labelId}>ID: <code>{k}</code></div>
            <div className={styles.lampRow}>
              <div className={`${styles.lamp} ${isOn(k) ? styles.lampOn : ""}`} />
            </div>
            <div className={styles.btnRow}>
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${busy === k ? styles.btnBusy : ""}`}
                onClick={() => toggle(k)}
                disabled={busy === k}
              >
                {isOn(k) ? "OFF" : "ON"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.meta}>
        último update: {lastUpdated}
      </div>
    </div>
  );
}
