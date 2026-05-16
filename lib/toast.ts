import toast from "react-hot-toast";
import { C } from "@/lib/colors";

const baseStyle = {
  borderRadius: "12px",
  fontSize: "15px",
  fontWeight: 500,
  padding: "12px 16px",
};

export function toastSuccess(message: string) {
  toast.success(message, {
    style: { ...baseStyle, background: C.teal, color: C.white },
    iconTheme: { primary: C.white, secondary: C.teal },
  });
}

export function toastError(message: string) {
  toast.error(message, {
    style: { ...baseStyle, background: C.coral, color: C.white },
    iconTheme: { primary: C.white, secondary: C.coral },
  });
}
