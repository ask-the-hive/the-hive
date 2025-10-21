import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-full text-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-neutral-300',
  {
    variants: {
      variant: {
        default:
          'bg-neutral-100 text-black hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700',
        brand:
          'bg-brand-600 dark:bg-brand-600 text-neutral-50 hover:bg-brand-600/90 dark:hover:bg-brand-600/90 border-2 border-brand-700 dark:border-brand-500 dark:hover:shadow-lg dark:hover:shadow-brand-600/30',
        destructive:
          'bg-red-500 text-neutral-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-neutral-50 dark:hover:bg-red-900/90',
        destructiveOutline:
          'border border-red-500 hover:bg-red-500/10 text-red-500 dark:border-red-900 dark:hover:bg-red-900/50',
        destructiveGhost: 'hover:bg-red-500/10 text-red-500 dark:hover:bg-red-900/50',
        warning:
          'bg-yellow-500 text-neutral-50 hover:bg-yellow-500/90 dark:bg-yellow-900 dark:text-neutral-50 dark:hover:bg-yellow-900/90',
        warningOutline:
          'border border-yellow-500 hover:bg-yellow-500/10 text-yellow-500 dark:border-yellow-900 dark:hover:bg-yellow-900/50',
        warningGhost: 'hover:bg-yellow-500/10 text-yellow-500 dark:hover:bg-yellow-900/50',
        outline:
          'border border-neutral-200 hover:bg-neutral-200/50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-700/50 dark:hover:text-neutral-50',
        secondary:
          'bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800/80',
        ghost:
          'hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-600 dark:hover:text-neutral-50 text-black dark:text-neutral-300',
        brandGhost:
          'hover:bg-brand-500/10 text-brand-500 dark:hover:bg-brand-900/50 text-brand-500',
        link: 'text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-50',
        brandOutline:
          'border border-brand-600 hover:bg-brand-600/10 text-brand-600 dark:border-brand-600 dark:hover:bg-brand-600/10',
      },
      size: {
        default: 'h-12 px-6 py-6',
        sm: 'h-9 rounded-lg px-4 text-xs',
        lg: 'h-14 rounded-lg px-10',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
