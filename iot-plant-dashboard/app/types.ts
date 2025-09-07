// app/types.ts
export interface LogEntry {
  id: string;
  timestamp?: Date | null;
  temperature?: number;
  humidity?: number;
  soil1?: number;
  soil2?: number;
  // Add any other fields you might have in your logs
}

export interface DeviceData {
  mode?: "MANUAL" | "AUTO";
  pump1?: boolean;
  pump2?: boolean;
  temperature?: number;
  humidity?: number;
  soil1?: number;
  soil2?: number;
  threshold1?: number;
  threshold2?: number;
}