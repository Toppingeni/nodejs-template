import * as React from "react";
import { cn } from "@/lib/utils";
import { useFormField } from "./FormField";

export const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => {
  const { formItemId } = useFormField();
  
  return (
    <label
      ref={ref}
      className={cn("text-sm font-medium text-slate-700", className)}
      htmlFor={formItemId}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
});
FormLabel.displayName = "FormLabel";
