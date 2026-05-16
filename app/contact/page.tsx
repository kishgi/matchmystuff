import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";

export default function ContactPage() {
  return (
    <div className="page-container-narrow">
      <h1 style={{ color: C.teal }}>{COPY.footer.contact}</h1>
    </div>
  );
}
