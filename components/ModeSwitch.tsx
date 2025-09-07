"use client";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = {
  mode: string;
};

export default function ModeSwitch({ mode }: Props) {
  const controlsRef = doc(db, "esp32", "esp32state");

  const handleChange = async (newMode: string) => {
    await updateDoc(controlsRef, { mode: newMode });
  };

  return (
    <div className="mt-4">
      <label className="mr-2 font-semibold">Mode:</label>
      <select
        value={mode}
        onChange={(e) => handleChange(e.target.value)}
        className="border p-2 rounded-lg"
      >
        <option value="auto">Auto</option>
        <option value="manual">Manual</option>
      </select>
    </div>
  );
}
