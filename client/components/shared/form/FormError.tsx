import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const formErrorVariants = cva("text-sm", {
  variants: {
    variant: {
      default: "text-red-500",
      warning: "text-amber-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface FormErrorProps extends VariantProps<typeof formErrorVariants> {
  message?: string | null;
  className?: string;
}

export function FormError({ message, variant, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <p
      className={cn(formErrorVariants({ variant }), className)}
      role="alert"
    >
      {message}
    </p>
  );
}
