import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = {
  success: <CheckCircle className="h-4 w-4" />,
  error:   <XCircle    className="h-4 w-4" />,
  info:    <Info       className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
};

const STYLES = {
  success: 'bg-success text-success-foreground',
  error:   'bg-destructive text-destructive-foreground',
  info:    'bg-primary text-primary-foreground',
  warning: 'bg-warning text-warning-foreground',
};

export function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 cursor-pointer rounded-lg px-4 py-3 text-sm font-medium shadow-lg animate-fade-in',
        STYLES[type] ?? STYLES.info,
      )}
    >
      {ICONS[type]}
      <span>{message}</span>
    </div>
  );
}
