// components/Cards.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>{title}</CardHeader>
      <CardContent>{value}</CardContent>
    </Card>
  );
}
