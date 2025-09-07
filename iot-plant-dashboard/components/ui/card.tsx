// components/ui/card.tsx
import * as React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl shadow-md bg-white p-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-semibold text-lg ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-2 text-gray-700 ${className}`}>{children}</div>;
}
