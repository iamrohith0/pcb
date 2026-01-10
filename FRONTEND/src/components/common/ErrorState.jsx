import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ErrorState({ title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      {onAction && actionLabel && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}