import * as React from "react";
import { FormItemContext } from "./form-context";
import { cn } from "@/lib/utils";

interface FormItemProps {
  children: React.ReactNode;
  className?: string;
}

export const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, children }, ref) => (
    <FormItemContext.Provider value={{ id: React.useId() }}>
      <div ref={ref} className={cn("space-y-2", className)}>
        {children}
      </div>
    </FormItemContext.Provider>
  ),
);
FormItem.displayName = "FormItem";
