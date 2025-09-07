"use client";
import { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase"; // ← Import db from firebase.ts

export default function Controls() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("AUTO");

  useEffect(() => {
    // Get current mode from Firestore on load
    const fetchMode = async () => {
      try {
        const docRef = doc(db, "devices", "esp32state");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMode(docSnap.data().mode || "AUTO");
        }
      } catch (error) {
        console.error("Error fetching mode:", error);
      }
    };
    fetchMode();
  }, []);

  const sendCommand = async (command: string) => {
    setLoading(true);
    try {
      await setDoc(doc(db, "devices", "esp32state"), {
        control: command
      }, { merge: true });
      console.log("Command sent:", command);
    } catch (error) {
      console.error("Error sending command:", error);
    }
    setLoading(false);
  };

  const changeMode = async (newMode: string) => {
    setLoading(true);
    try {
      await setDoc(doc(db, "devices", "esp32state"), {
        mode: newMode
      }, { merge: true });
      setMode(newMode);
      console.log("Mode changed:", newMode);
    } catch (error) {
      console.error("Error changing mode:", error);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold">Pump Control</h2>

      {/* Mode Switch */}
      <div className="flex gap-4">
        <button
          onClick={() => changeMode("AUTO")}
          disabled={loading || mode === "AUTO"}
          className={`px-4 py-2 rounded-lg shadow ${
            mode === "AUTO" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          AUTO
        </button>
        <button
          onClick={() => changeMode("MANUAL")}
          disabled={loading || mode === "MANUAL"}
          className={`px-4 py-2 rounded-lg shadow ${
            mode === "MANUAL" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          MANUAL
        </button>
      </div>

      {/* Manual Pump Control (only active in MANUAL) */}
      {mode === "MANUAL" && (
        <div className="flex gap-4">
          <button
            onClick={() => sendCommand("ON")}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600"
          >
            Pump ON
          </button>
          <button
            onClick={() => sendCommand("OFF")}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600"
          >
            Pump OFF
          </button>
        </div>
      )}
    </div>
  );
}