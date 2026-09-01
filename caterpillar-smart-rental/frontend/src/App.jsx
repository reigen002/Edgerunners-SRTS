import { Routes, Route, Link } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { AssetDetail } from "./pages/AssetDetail";
import { DEMO_NOW } from "./mock/seed";
import { IconTruck, IconClock } from "./components/icons";

export default function App() {
  return (
    <div className="min-h-screen bg-ground">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-ground/95 px-4 py-2.5 backdrop-blur sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center bg-signal-high text-signal-high-ink">
            <IconTruck className="text-[13px]" />
          </span>
          <span className="text-sm font-semibold tracking-wide text-ink">SRTS</span>
          <span className="hidden text-[13px] text-ink-faint sm:inline">Smart Rental Tracking</span>
        </Link>
        <div className="flex items-center gap-1.5 font-mono text-[12px] text-ink-faint">
          <IconClock />
          {DEMO_NOW.replace("T", " ")}
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/asset/:id" element={<AssetDetail />} />
        </Routes>
      </main>
    </div>
  );
}
