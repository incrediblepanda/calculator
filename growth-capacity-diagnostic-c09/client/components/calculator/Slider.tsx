import { useEffect, useRef } from "react";

interface SliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  showRange?: boolean;
}

export default function Slider({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  showRange = false,
}: SliderProps) {
  const rangeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (rangeRef.current) {
      rangeRef.current.style.setProperty(
        "--range-progress",
        `${((value - min) / (max - min)) * 100}%`,
      );
    }
  }, [value, min, max]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-bold text-navy-800">{label}</span>
          {description && (
            <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-start gap-1 shrink-0 w-[120px] justify-end">
          <button
            onClick={() => onChange(Math.max(min, value - step))}
            className="w-7 h-7 mt-[1px] flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-base leading-none transition-colors select-none"
            aria-label="Decrease"
          >
            -
          </button>
          <div className="flex flex-col items-center">
            <input
              type="number"
              value={value}
              min={min}
              max={max}
              step={step}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
              }}
              className="w-16 text-center text-sm font-black text-navy-900 bg-white border-2 border-navy-200 rounded-lg py-1 px-1 focus:outline-none focus:border-coral-500 tabular-nums transition-colors"
              style={{ textAlign: "center" }}
            />
            {unit && (
              <span className="text-[11px] text-gray-400/60 font-medium italic mt-0.5">
                {unit}
              </span>
            )}
          </div>
          <button
            onClick={() => onChange(Math.min(max, value + step))}
            className="w-7 h-7 mt-[1px] flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-base leading-none transition-colors select-none"
            aria-label="Increase"
          >
            +
          </button>
        </div>
      </div>
      {showRange && (
        <input
          ref={rangeRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="input-range w-full"
          style={
            {
              "--range-progress": `${((value - min) / (max - min)) * 100}%`,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
}
