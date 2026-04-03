import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { type ZodType, type z } from "zod";

interface FormProps<T extends ZodType<any, any, any>> extends React.HTMLAttributes<HTMLFormElement> {
  form: ReturnType<typeof useForm<z.infer<T>>>;
  onSubmit: (values: z.infer<T>) => void;
  children: React.ReactNode;
}

function Form<T extends ZodType<any, any, any>>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: FormProps<T>) {
  return (
    <FormProvider {...form}>
      <form {...props} onSubmit={form.handleSubmit(onSubmit)} className={className}>
        {children}
      </form>
    </FormProvider>
  );
}

export { Form };
export type { FormProps };
