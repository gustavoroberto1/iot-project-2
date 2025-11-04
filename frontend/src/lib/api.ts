import axios from "axios";

export type LedState = "on" | "off";

type NumericSensorKey =
  | "potenciometro1"
  | "fotorresistor1"
  | "ultrassonico1"
  | "temperatura1"
  | "umidade1";

export type DeviceDoc = {
  _id?: string;
  device_id: string;
  model?: string;
  ip_address?: string;
  mac_address?: string;
  location?: string;
  created_at?: string;
  update_at?: string;
  raw?: string;
  state?: (
    {
      led1?: LedState;
      last_updated?: string;
    } &Partial<Record<NumericSensorKey, number>>
  );
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:1880",
});

export async function fetchStates(): Promise<Array<DeviceDoc>> {
  const { data } = await api.get("/api/devices");
  return data;
}

export async function setLed(deviceId: string, target: "led1"|"led2"|"led3", state: "on"|"off") {
  await api.post(`/api/device/${deviceId}/cmd`, { target, state });
}