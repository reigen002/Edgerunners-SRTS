import { useEffect, useRef, useState } from "react";
import { IconGauge } from "./icons";

const FRAME_MS = 350;

function Gauge({ label, value, unit, warn }) {
  return (
    <div className="border border-hairline bg-panel-raised px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`mt-0.5 font-mono text-lg tabular-nums ${warn ? "text-signal-high" : "text-ink"}`}>
        {value}{unit}
      </div>
    </div>
  );
}

export function TelemetryPanel({ frames, onFrame }) {
  const [i, setI] = useState(frames.length ? frames.length - 1 : 0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((prev) => {
        if (prev >= frames.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, FRAME_MS);
    return () => clearInterval(timer.current);
  }, [playing, frames.length]);

  const frame = frames[i];
  useEffect(() => { onFrame?.(frame); }, [frame, onFrame]);

  if (!frames.length) {
    return (
      <div className="border border-hairline bg-panel p-4 text-sm text-ink-faint">
        No active telemetry scenario for this asset.
      </div>
    );
  }

  return (
    <div className="border border-hairline bg-panel p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          <IconGauge /> Live Telemetry Playback
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (i >= frames.length - 1) setI(0); setPlaying((p) => !p); }}
            className="border border-hairline-strong px-2.5 py-1 text-xs text-ink hover:bg-panel-raised"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <span className="font-mono text-xs text-ink-faint">
            frame {i + 1}/{frames.length}
          </span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={frames.length - 1}
        value={i}
        onChange={(e) => { setPlaying(false); setI(Number(e.target.value)); }}
        className="mt-3 w-full accent-signal-high"
      />

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Gauge label="Engine Temp" value={frame.engine_temp_c} unit="°C" warn={frame.engine_temp_c > 105} />
        <Gauge label="Fuel" value={frame.fuel_pct} unit="%" />
        <Gauge label="Fuel Rate" value={frame.fuel_rate_lph} unit=" L/h" />
        <Gauge label="Seatbelt" value={frame.seatbelt} unit="" warn={frame.seatbelt === "OFF"} />
      </div>
      {frame.fault_code && (
        <div className="mt-2 border border-signal-high/40 bg-signal-high/10 px-3 py-1.5 font-mono text-xs text-signal-high">
          FAULT: {frame.fault_code}
        </div>
      )}
    </div>
  );
}
