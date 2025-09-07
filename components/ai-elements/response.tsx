'use client';

import { cn } from '@/lib/utils';
import { type ComponentProps, memo } from 'react';
import MarkdownContent from '@/components/MarkdownContent';

type ResponseProps = {
  children: string;
  className?: string;
};

export const Response = memo(
  ({ className, children, ...props }: ResponseProps) => (
    <MarkdownContent
      className={cn(
        'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className
      )}
      {...props}
    >
      {children}
    </MarkdownContent>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = 'Response';
