import React from 'react';
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExpandCollapseButtonProps {
  isExpanded: boolean;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

export const ExpandCollapseButton: React.FC<ExpandCollapseButtonProps> = ({
  isExpanded,
  onClick,
  disabled = false,
  className
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-6 w-6 p-0 hover:bg-muted transition-colors",
        className
      )}
    >
      {isExpanded ? (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
};