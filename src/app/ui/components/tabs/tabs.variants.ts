import { cva, VariantProps } from 'class-variance-authority';

import { zAlign } from './tabs.component';

export const tabContainerVariants = cva('flex w-full h-full', {
  variants: {
    zPosition: {
      top: 'flex-col',
      bottom: 'flex-col',
      left: 'flex-row',
      right: 'flex-row',
    },
  },
  defaultVariants: {
    zPosition: 'top',
  },
});

export const tabNavVariants = cva('flex gap-[1rem] overflow-auto scroll nav-tab-scroll', {
  variants: {
    zPosition: {
      top: 'flex-row border-b border-white/10 mb-[1rem] w-full',
      bottom: 'flex-row border-t border-white/10 mt-[1rem] w-full',
      left: 'flex-col border-r border-white/10 mr-[1rem] h-full min-h-0',
      right: 'flex-col border-l border-white/10 ml-[1rem] h-full min-h-0',
    },
    zAlignTabs: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    },
  },
  defaultVariants: {
    zPosition: 'top',
    zAlignTabs: 'start',
  },
});

export const tabButtonVariants = cva('hover:bg-transparent rounded-none flex-shrink-0', {
  variants: {
    zActivePosition: {
      top: '',
      bottom: '',
      left: '',
      right: '',
    },
    isActive: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      zActivePosition: 'top',
      isActive: true,
      class: 'border-t-2 border-t-primary text-primary',
    },
    {
      zActivePosition: 'bottom',
      isActive: true,
      class: 'border-b-2 border-b-primary text-primary',
    },
    {
      zActivePosition: 'left',
      isActive: true,
      class: 'border-l-2 border-l-primary text-primary',
    },
    {
      zActivePosition: 'right',
      isActive: true,
      class: 'border-r-2 border-r-primary text-primary',
    },
  ],
  defaultVariants: {
    zActivePosition: 'bottom',
    isActive: false,
  },
});

export type ZardTabVariants = VariantProps<typeof tabContainerVariants> & VariantProps<typeof tabNavVariants> & VariantProps<typeof tabButtonVariants> & { zAlignTabs: zAlign };
