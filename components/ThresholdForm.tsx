"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "./ui/button"; // keep if you already have Button, otherwise replace with <button>

export function ThresholdForm() {
  const [threshold1, setThreshold1] = useState<number>(0);
  const [threshold2, setThreshold2] = useState<number>(0);

  // Load thresholds from Firestore on mount
  useEffect(() => {
    const fetchThresholds = async () => {
      const docRef = doc(db, "devices", "myDevice01");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setThreshold1(data.threshold1 ?? 0);
        setThreshold2(data.threshold2 ?? 0);
      }
    };
    fetchThresholds();
  }, []);

  // Save thresholds to Firestore
  const saveThresholds = async () => {
    const docRef = doc(db, "devices", "myDevice01");
    await updateDoc(docRef, {
      threshold1,
      threshold2,
    });
    alert("Thresholds updated!");
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-blue-200">
      <h2 className="text-xl font-bold text-blue-800 mb-4">
        Set Soil Thresholds
      </h2>

      {/* Threshold 1 */}
      <div className="mb-4">
        <label className="block text-blue-800 font-bold mb-1">
          Threshold 1 (%)
        </label>
        <input
          type="number"
          value={threshold1}
          onChange={(e) => setThreshold1(Number(e.target.value))}
          className="w-full p-2 rounded-lg text-blue-900 font-semibold bg-white border border-blue-400 shadow-sm"
        />
      </div>

      {/* Threshold 2 */}
      <div className="mb-4">
        <label className="block text-blue-800 font-bold mb-1">
          Threshold 2 (%)
        </label>
        <input
          type="number"
          value={threshold2}
          onChange={(e) => setThreshold2(Number(e.target.value))}
          className="w-full p-2 rounded-lg text-blue-900 font-semibold bg-white border border-blue-400 shadow-sm"
        />
      </div>

      {/* Save Button */}
      <Button onClick={saveThresholds} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700">
        Save Thresholds
      </Button>
    </div>
  );
}
