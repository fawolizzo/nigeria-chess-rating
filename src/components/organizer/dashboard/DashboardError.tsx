
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DashboardErrorProps {
  error: string;
  onRetry: () => void;
}

export function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <div className="p-4">
      <Card className="p-6 bg-red-50">
        <h2 className="text-lg font-semibold text-red-700">Error</h2>
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          onClick={onRetry}
          className="mt-4"
        >
          Retry
        </Button>
      </Card>
    </div>
  );
}
