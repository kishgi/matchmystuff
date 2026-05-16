import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold" style={{ color: C.teal }}>
        {COPY.footer.contact}
      </h1>
    </div>
  );
}
