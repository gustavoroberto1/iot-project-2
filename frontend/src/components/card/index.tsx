"use client";

import { DeviceDoc, LedState, setLed } from "@/lib/api";
import { useMemo, useState } from "react";
import styles from "../../styles/styles.module.css";

function fmtNumber(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

const LABEL_BY_KEY: Record<string, string> = {
  potenciometro1: "Potenciômetro 1",
  fotorresistor1: "Fotoresistor 1",
  ultrassonico1: "Ultrassônico 1",
  temperatura1: "Temperatura 1",
  umidade1: "Umidade 1",
};

const UNIT_BY_KEY: Record<string, string> = {
  fotorresistor1: "lux",
  ultrassonico1: "cm",
  temperatura1: "°C",
  umidade1: "%",
};

function prettyLabel(key: string) {
  return LABEL_BY_KEY[key] ?? key;
}

export default function DeviceCard({
  doc,
  onRefresh,
}: {
  doc: DeviceDoc;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  function clampInt(n: number) {
  const x = Math.round(n);
  if (!Number.isFinite(x)) return 0;
  return x;
}
function getPotRange(v: number): [number, number] {
  return v > 1023 ? [0, 4095] : [0, 1023];
}

  const isOn = (doc.state?.led1 ?? "off") === "on";

  const lastUpdated = useMemo(() => {
    const ts = doc.state?.last_updated || doc.update_at || doc.created_at;
    return ts ? new Date(ts).toLocaleString() : "—";
  }, [doc]);

  const numericEntries = useMemo(() => {
    const st = doc.state ?? {};
    return Object.entries(st).filter(
      ([k, v]) =>
        k !== "led1" &&
        k !== "last_updated" &&
        typeof v === "number"
    );
  }, [doc.state]);

  async function toggleLed() {
    try {
      setBusy(true);
      const next: LedState = isOn ? "off" : "on";
      await setLed(doc.device_id, "led1", next);
      onRefresh();
    } finally {
      setBusy(false);
    }
  }

function renderPotenciometro(key: string, value: number) {
  const label = prettyLabel(key);
  const v = clampInt(value);
  const [min, max] = getPotRange(v);

  return (
    <div key={key} className={styles.lampCard}>
      <div className={styles.labelId}>
        {label}: <code>{key}</code>
      </div>

      <div className={styles.lampRow} style={{ width: "100%" }}>
        <input
          type="range"
          min={min}
          max={max}
          value={v}
          readOnly
          disabled
          aria-label={`${label} (somente leitura)`}
          style={{ width: "100%", cursor: "not-allowed", opacity: 0.75 }}
        />
      </div>

      <div className={styles.btnRow} style={{ justifyContent: "space-between", width: "100%" }}>
        <span className={styles.pill}>
          valor: {v}
        </span>
        <span className={styles.pill}>
          faixa: {min}–{max}
        </span>
      </div>
    </div>
  );
}

  function renderNumericSensor(key: string, value: number) {
    const label = prettyLabel(key);
    const unit = UNIT_BY_KEY[key];
    return (
      <div key={key} className={styles.lampCard}>
        <div className={styles.labelId}>
          {label}: <code>{key}</code>
        </div>
        <div className={styles.lampRow}>
          <div className={styles.readout}>
            {fmtNumber(value)}{unit ? ` ${unit}` : ""}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.device}>
      <div className={styles.deviceHead}>
        <div className={styles.deviceTitle}>{doc.device_id}</div>
        <span className={styles.pill}>
          {isOn ? "●" : "○"} · {numericEntries.length} sensor(es)
        </span>
      </div>

      <div className={styles.btnRow} style={{ marginBottom: 8 }}>
        {doc.model && <span className={styles.pill}>Model:  {doc.model}</span>}
        {doc.ip_address && <span className={styles.pill}>IP: {doc.ip_address}</span>}
        {doc.mac_address && <span className={styles.pill}>MAC: {doc.mac_address}</span>}
        {doc.location && <span className={styles.pill}>Location: {doc.location}</span>}
      </div>

      <div className={styles.ledGrid}>
        <div className={styles.lampCard}>
          <div className={styles.labelId}>LED: <code>led1</code></div>
          <div className={styles.lampRow}>
            <div className={`${styles.lamp} ${isOn ? styles.lampOn : ""}`} />
          </div>
          <div className={styles.btnRow}>
            <button
              className={`${styles.btn} ${styles.btnPrimary} ${busy ? styles.btnBusy : ""}`}
              onClick={toggleLed}
              disabled={busy}
            >
              {isOn ? "OFF" : "ON"}
            </button>
          </div>
        </div>

        {numericEntries.map(([k, v]) =>
          k === "potenciometro1"
            ? renderPotenciometro(k, v as number)
            : renderNumericSensor(k, v as number)
        )}
      </div>

      <div className={styles.meta}>último update: {lastUpdated}</div>
    </div>
  );
}
