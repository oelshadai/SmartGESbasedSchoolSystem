import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <div className="stat-card flex flex-col items-center justify-center py-16 space-y-4">
    <div className="p-4 rounded-full bg-muted text-muted-foreground">{icon}</div>
    <div className="text-center space-y-1">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
    {actionLabel && (
      <Button onClick={onAction}>
        <Plus className="h-4 w-4 mr-2" />
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
