import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-5 overflow-hidden transition-all duration-300",
        hoverable && "glass-panel-hover cursor-pointer",
        glow && "glow-indigo",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
