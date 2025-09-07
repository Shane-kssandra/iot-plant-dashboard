// src/lib/device.ts
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot,
  collection, addDoc, query, orderBy, limit,
  DocumentData, QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "./firebase";

export type PumpState = "ON" | "OFF";
export type PumpCmd = "ON" | "OFF" | "AUTO";

export interface DeviceDoc {
  ownerUid?: string;
  name?: string;
  mode: "auto" | "manual";
  thresholds: { soil1: number; soil2: number; };
  commands: { pump1: PumpCmd; pump2: PumpCmd; };
  state: { 
    temp: number; 
    humidity: number; 
    soil1: number; 
    soil2: number;
    pump1State: PumpState; 
    pump2State: PumpState; 
  };
  lastUpdate?: Date;
}

export interface ReadingData {
  temp: number; 
  humidity: number; 
  soil1: number; 
  soil2: number;
  pump1State: PumpState; 
  pump2State: PumpState;
  createdAt: Date;
  id?: string;
}

export async function initDevice(deviceId: string, ownerUid: string) {
  const ref = doc(db, "devices", deviceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const base: DeviceDoc = {
      ownerUid,
      name: "My Plant Rig",
      mode: "auto",
      thresholds: { soil1: 35, soil2: 35 },
      commands: { pump1: "AUTO", pump2: "AUTO" },
      state: { temp: 26, humidity: 55, soil1: 50, soil2: 48, pump1State: "OFF", pump2State: "OFF" },
    };
    await setDoc(ref, base);
  } else if (!snap.data().ownerUid) {
    await updateDoc(ref, { ownerUid });
  }
  return ref;
}

export function deviceDocRef(deviceId: string) {
  return doc(db, "devices", deviceId);
}

export function readingsCollRef(deviceId: string) {
  return collection(db, "devices", deviceId, "readings");
}

export async function addReading(deviceId: string, reading: {
  temp: number; humidity: number; soil1: number; soil2: number;
  pump1State: PumpState; pump2State: PumpState;
}) {
  const now = new Date();
  await addDoc(readingsCollRef(deviceId), {
    ...reading,
    createdAt: now,
  });
  await updateDoc(deviceDocRef(deviceId), {
    state: reading,
    lastUpdate: now,
  });
}

export function liveDevice(deviceId: string, onData: (data: DeviceDoc | null) => void) {
  return onSnapshot(deviceDocRef(deviceId), (snap) => {
    onData(snap.exists() ? (snap.data() as DeviceDoc) : null);
  });
}

export function liveRecentReadings(deviceId: string, onData: (rows: ReadingData[]) => void) {
  const q = query(readingsCollRef(deviceId), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ 
      id: doc.id, 
      ...doc.data() 
    } as ReadingData));
    onData(rows);
  });
}