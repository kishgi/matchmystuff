import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";

export default function TermsPage() {
  return (
    <div className="page-container-narrow">
      <h1 style={{ color: C.teal }}>{COPY.footer.terms}</h1>
    </div>
  );
}
