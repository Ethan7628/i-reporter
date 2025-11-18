import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
}

/**
 * Error Message Component
 * 
 * Displays error, warning, or info messages with optional retry action
 */
export const ErrorMessage = ({ 
  title, 
  message, 
  type = 'error',
  onRetry 
}: ErrorMessageProps) => {
  const icons = {
    error: <AlertCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  };

  const variants = {
    error: 'destructive' as const,
    warning: 'default' as const,
    info: 'default' as const,
  };

  return (
    <Alert variant={variants[type]} className="my-4">
      {icons[type]}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="flex flex-col gap-2">
        {message}
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm underline hover:no-underline mt-2 text-left"
          >
            Try again
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
};
