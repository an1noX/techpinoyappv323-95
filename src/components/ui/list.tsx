
import React from 'react';
import { cn } from '@/lib/utils';

interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  children: React.ReactNode;
}

interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
}

export const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {children}
      </ul>
    );
  }
);
List.displayName = "List";

export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn("flex items-center justify-between p-2 rounded-md border", className)}
        {...props}
      >
        {children}
      </li>
    );
  }
);
ListItem.displayName = "ListItem";
