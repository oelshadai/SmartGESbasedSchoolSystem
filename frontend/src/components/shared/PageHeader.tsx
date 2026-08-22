import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  action?: React.ReactNode;
}

const PageHeader = ({ title, description, actionLabel, onAction, actionIcon, action }: PageHeaderProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0 flex-1">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words">{title}</h1>
      <p className="text-xs sm:text-sm text-foreground/70 mt-0.5 sm:mt-1">{description}</p>
    </div>
    <div className="shrink-0 max-w-full sm:w-auto sm:max-w-[60%]">
      {action || (actionLabel && (
        <Button onClick={onAction} size="sm" className="self-start sm:self-auto shrink-0">
          {actionIcon || <Plus className="h-4 w-4 mr-1.5" />}
          <span className="text-xs sm:text-sm">{actionLabel}</span>
        </Button>
      ))}
    </div>
  </div>
);

export default PageHeader;
