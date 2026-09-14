import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  description,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <section className="mx-auto max-w-5xl px-4 pb-4 sm:px-6 lg:px-8">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 rounded-xl border border-blue-100 bg-white px-5 py-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>
          <span className="block text-lg font-black text-[#25304a]">
            {title}
          </span>
          <span className="mt-1 block text-sm text-slate-600">
            {description}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-blue-600 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div id={contentId} className="mt-3">
          {children}
        </div>
      )}
    </section>
  );
}
