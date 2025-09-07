"use client";

import { useEffect, useState, useRef } from "react";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  where,
  Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Keep your local type definitions (remove any import from './types')
interface LogEntry {
  id: string;
  timestamp?: Date | null;
  temperature?: number;
  humidity?: number;
  soil1?: number;
  soil2?: number;
}

interface DeviceData {
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

export default function Dashboard() {
  const [mode, setMode] = useState<"MANUAL" | "AUTO">("AUTO");
  const [pump1, setPump1] = useState(false);
  const [pump2, setPump2] = useState(false);
  const [temp, setTemp] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [soil1, setSoil1] = useState<number | null>(null);
  const [soil2, setSoil2] = useState<number | null>(null);
  const [threshold1, setThreshold1] = useState<number>(400);
  const [threshold2, setThreshold2] = useState<number>(400);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // Use refs to avoid missing dependencies in useEffect
  const deviceRef = useRef(doc(db, "devices", "esp32state"));
  const logsRef = useRef(collection(db, "logs"));

  useEffect(() => {
    const unsubscribe = onSnapshot(deviceRef.current, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as DeviceData;
        setMode(data.mode || "AUTO");
        setPump1(data.pump1 || false);
        setPump2(data.pump2 || false);
        setTemp(data.temperature ?? null);
        setHumidity(data.humidity ?? null);
        setSoil1(data.soil1 ?? null);
        setSoil2(data.soil2 ?? null);
        setThreshold1(data.threshold1 || 400);
        setThreshold2(data.threshold2 || 400);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    }, (error) => {
      console.error("Device listener error:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    const q = query(
      logsRef.current, 
      orderBy("timestamp", "desc"),
      where("timestamp", ">=", thirtyDaysAgo),
      limit(30)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map((doc) => { 
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            timestamp: data.timestamp ? data.timestamp.toDate() : null
          } as LogEntry;
        });
        setLogs(items);
      },
      (error) => {
        console.error("Logs listener error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleModeChange = async (newMode: "MANUAL" | "AUTO") => {
    try {
      setMode(newMode);
      await setDoc(deviceRef.current, { mode: newMode }, { merge: true });
    } catch (error) {
      console.error("Error updating mode:", error);
    }
  };

  const togglePump = async (pump: "pump1" | "pump2", current: boolean) => {
    try {
      if (pump === "pump1") setPump1(!current);
      if (pump === "pump2") setPump2(!current);
      await setDoc(deviceRef.current, { [pump]: !current }, { merge: true });
    } catch (error) {
      console.error("Error toggling pump:", error);
    }
  };

  const saveThresholds = async () => {
    try {
      setSaving(true);
      setSaveStatus("Saving...");
      await setDoc(deviceRef.current, { threshold1, threshold2 }, { merge: true });
      setSaveStatus("Thresholds updated successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("Error saving thresholds:", error);
      setSaveStatus("Error saving thresholds. Please try again.");
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const refreshAllData = async () => {
    try {
      const snap = await getDoc(deviceRef.current);
      if (snap.exists()) {
        const data = snap.data() as DeviceData;
        setMode(data.mode || "AUTO");
        setPump1(data.pump1 || false);
        setPump2(data.pump2 || false);
        setTemp(data.temperature ?? null);
        setHumidity(data.humidity ?? null);
        setSoil1(data.soil1 ?? null);
        setSoil2(data.soil2 ?? null);
        setThreshold1(data.threshold1 || 400);
        setThreshold2(data.threshold2 || 400);
      }

      const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const q = query(logsRef.current, orderBy("timestamp", "desc"), where("timestamp", ">=", thirtyDaysAgo), limit(30));
      const snapshot = await getDocs(q);
      const logItems = snapshot.docs.map((doc) => { 
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : null
        } as LogEntry;
      });
      setLogs(logItems);
      
      setLastUpdate(new Date().toLocaleTimeString());
      setSaveStatus("Data refreshed!");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-blue-700 text-center">
          💧 Smart Plant Watering Dashboard
        </h1>

        {saveStatus && (
          <div className={`p-3 rounded-lg text-center ${
            saveStatus.includes("Error") 
              ? "bg-red-100 text-red-700" 
              : "bg-green-100 text-green-700"
          }`}>
            {saveStatus}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last update: {lastUpdate || "Never"}
          </div>
          <button 
            onClick={refreshAllData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
          >
            🔄 Refresh All
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleModeChange("MANUAL")}
            className={`px-6 py-2 rounded-lg font-semibold ${
              mode === "MANUAL"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => handleModeChange("AUTO")}
            className={`px-6 py-2 rounded-lg font-semibold ${
              mode === "AUTO"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            Auto
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xl font-bold">
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-center text-blue-700">
            🌡️ Temp <br /> {temp ?? "--"}°C
          </div>
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-center text-blue-700">
            💧 Hum <br /> {humidity ?? "--"}%
          </div>
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-center text-blue-700">
            🌱 Soil1 <br /> {soil1 ?? "--"}
          </div>
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-center text-blue-700">
            🌱 Soil2 <br /> {soil2 ?? "--"}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
          <h2 className="text-lg font-semibold text-blue-700 text-center">Threshold Settings</h2>
          <p className="text-sm text-blue-600 text-center">
            In AUTO mode, pumps will turn on for 15 seconds when soil moisture drops below these values
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <div className="flex flex-col items-center">
              <label className="text-sm text-blue-700 mb-1">Soil1 Threshold</label>
              <input
                type="number"
                value={threshold1}
                onChange={(e) => setThreshold1(Number(e.target.value))}
                className="border p-2 rounded-lg w-28 text-center border-blue-300 text-blue-700"
                min="0"
                max="4095"
              />
            </div>
            <div className="flex flex-col items-center">
              <label className="text-sm text-blue-700 mb-1">Soil2 Threshold</label>
              <input
                type="number"
                value={threshold2}
                onChange={(e) => setThreshold2(Number(e.target.value))}
                className="border p-2 rounded-lg w-28 text-center border-blue-300 text-blue-700"
                min="0"
                max="4095"
              />
            </div>
            <button
              onClick={saveThresholds}
              disabled={saving}
              className={`px-6 py-2 rounded-lg font-semibold mt-4 md:mt-6 ${
                saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {saving ? "Saving..." : "Save Thresholds"}
            </button>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-green-700 text-center">Current Threshold Status</h2>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="text-center">
              <p className="text-green-700">Soil1: {soil1 ?? "--"}</p>
              <p className={`text-sm ${soil1 !== null && soil1 < threshold1 ? "text-red-600 font-bold" : "text-green-600"}`}>
                {soil1 !== null && soil1 < threshold1 ? "💧 Needs water" : "✅ Moisture OK"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-green-700">Soil2: {soil2 ?? "--"}</p>
              <p className={`text-sm ${soil2 !== null && soil2 < threshold2 ? "text-red-600 font-bold" : "text-green-600"}`}>
                {soil2 !== null && soil2 < threshold2 ? "💧 Needs water" : "✅ Moisture OK"}
              </p>
            </div>
          </div>
        </div>

        {mode === "MANUAL" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
            <h2 className="text-lg font-semibold text-blue-700 text-center">
              Pump Controls
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => togglePump("pump1", pump1)}
                className={`px-6 py-2 rounded-lg ${
                  pump1 ? "bg-red-500 text-white" : "bg-gray-300 text-gray-700"
                }`}
              >
                Pump1 {pump1 ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => togglePump("pump2", pump2)}
                className={`px-6 py-2 rounded-lg ${
                  pump2 ? "bg-red-500 text-white" : "bg-gray-300 text-gray-700"
                }`}
              >
                Pump2 {pump2 ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-blue-700 text-center mb-2">
            Daily Logs (Last 30 Days)
          </h2>
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              <tr className="bg-blue-100 text-blue-700">
                <th className="p-2">Date</th>
                <th className="p-2">Temp</th>
                <th className="p-2">Hum</th>
                <th className="p-2">Soil1</th>
                <th className="p-2">Soil2</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="border-t text-blue-800">
                    <td className="p-2">
                      {log.timestamp ? log.timestamp.toLocaleDateString() : "--"}
                    </td>
                    <td className="p-2">{log.temperature || "--"}</td>
                    <td className="p-2">{log.humidity || "--"}</td>
                    <td className="p-2">{log.soil1 || "--"}</td>
                    <td className="p-2">{log.soil2 || "--"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-500">
                    No daily logs found yet...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}