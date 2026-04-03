import * as React from "react";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { FormItemContext } from "./form-context";
import { FormItem } from "./FormItem";
import { FormLabel } from "./FormLabel";
import { FormControl } from "./FormControl";
import { FormMessage } from "./FormMessage";

const FormFieldContext = React.createContext<ControllerProps>(
  {} as ControllerProps,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={props as any}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);

  if (!fieldContext || !itemContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;
  const formState = (fieldContext as any).formState;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error: formState?.errors?.[fieldContext.name as any],
  };
};

const FormFieldItem = ({ children }: { children: React.ReactNode }) => {
  return <FormItem>{children}</FormItem>;
};

export { FormField, useFormField, FormFieldItem, FormItem, FormLabel, FormControl, FormMessage };
