import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";

export default function PrivacyPage() {
  return (
    <div className="page-container-narrow">
      <h1 style={{ color: C.teal }}>{COPY.footer.privacy}</h1>
    </div>
  );
}
