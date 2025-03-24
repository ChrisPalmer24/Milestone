import { Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-neutral-900">Investment Tracker</h1>
        <button className="text-neutral-700 hover:text-neutral-900" aria-label="Settings">
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
