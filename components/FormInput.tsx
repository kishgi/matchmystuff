import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FormInputProps = InputHTMLAttributes<HTMLInputElement>;

export function FormInput({ className = "", ...props }: FormInputProps) {
  return (
    <input
      suppressHydrationWarning
      className={`input-field ${className}`.trim()}
      {...props}
    />
  );
}

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function FormTextarea({ className = "", ...props }: FormTextareaProps) {
  return (
    <textarea
      suppressHydrationWarning
      className={`input-field ${className}`.trim()}
      {...props}
    />
  );
}
