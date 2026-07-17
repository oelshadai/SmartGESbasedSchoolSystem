import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const textVariants = cva('', {
  variants: {
    variant: {
      default: 'text-primary-enhanced',
      secondary: 'text-secondary-enhanced',
      muted: 'text-muted-enhanced',
      'high-contrast': 'text-high-contrast',
      'medium-contrast': 'text-medium-contrast',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm readable-text-sm',
      base: 'text-base readable-text',
      lg: 'text-lg readable-text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    contrast: {
      normal: '',
      high: 'text-high-contrast font-semibold',
      enhanced: 'text-primary-enhanced',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'base',
    weight: 'normal',
    contrast: 'normal',
  },
});

export interface EnhancedTextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
}

export function EnhancedText({
  className,
  variant,
  size,
  weight,
  contrast,
  as: Component = 'p',
  children,
  ...props
}: EnhancedTextProps) {
  return (
    <Component
      className={cn(textVariants({ variant, size, weight, contrast }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}

// Enhanced Card Components with better text visibility
export function EnhancedCard({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'high-contrast-card rounded-lg p-6 shadow-sm transition-all hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function EnhancedCardTitle({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('card-title-enhanced mb-2', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function EnhancedCardDescription({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('card-description-enhanced mb-4', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function EnhancedCardContent({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('card-content-enhanced', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Enhanced Button with better text visibility
export function EnhancedButton({
  className,
  variant = 'default',
  size = 'default',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}) {
  const baseClasses = 'high-contrast-button inline-flex items-center justify-center rounded-md font-medium transition-all focus-enhanced';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Enhanced Input with better visibility
export function EnhancedInput({
  className,
  type = 'text',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'enhanced-input flex h-10 w-full rounded-md px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

// Enhanced Label with better visibility
export function EnhancedLabel({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'text-primary-enhanced text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

// Enhanced Table with better text visibility
export function EnhancedTable({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={cn('enhanced-table w-full caption-bottom text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function EnhancedTableHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('[&_tr]:border-b', className)} {...props}>
      {children}
    </thead>
  );
}

export function EnhancedTableBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  );
}

export function EnhancedTableRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function EnhancedTableHead({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-semibold text-high-contrast [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function EnhancedTableCell({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'p-4 align-middle text-primary-enhanced [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

// Enhanced Badge with better visibility
export function EnhancedBadge({
  className,
  variant = 'default',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}) {
  const variantClasses = {
    default: 'status-text-info',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'status-text-error',
    outline: 'text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    success: 'status-text-success',
    warning: 'status-text-warning',
  };

  return (
    <div
      className={cn(
        'enhanced-badge inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Enhanced Alert with better text visibility
export function EnhancedAlert({
  className,
  variant = 'default',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}) {
  const variantClasses = {
    default: 'bg-background text-foreground border-border',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    success: 'border-success/50 text-success dark:border-success [&>svg]:text-success',
    warning: 'border-warning/50 text-warning dark:border-warning [&>svg]:text-warning',
  };

  return (
    <div
      className={cn(
        'enhanced-alert relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function EnhancedAlertTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn('alert-title mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h5>
  );
}

export function EnhancedAlertDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn('alert-description text-sm [&_p]:leading-relaxed', className)}
      {...props}
    >
      {children}
    </div>
  );
}