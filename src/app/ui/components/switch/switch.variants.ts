import { cva, VariantProps } from 'class-variance-authority';

export const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-input',
  {
    variants: {
      zType: {
        default: 'data-[state=checked]:bg-primary',
        destructive: 'data-[state=checked]:bg-destructive',
      },
      zSize: {
        default: 'h-[1.5rem] w-[2.75rem]',
        sm: 'h-[1.25rem] w-[2.25rem]',
        lg: 'h-[1.75rem] w-[3rem]',
      },
    },
    defaultVariants: {
      zType: 'default',
      zSize: 'default',
    },
  },
);

export type ZardSwitchVariants = VariantProps<typeof switchVariants>;
