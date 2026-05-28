import { useEffect, useRef } from "react";

interface InputSliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}

export default function InputSlider({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix = "",
  suffix = "",
}: InputSliderProps) {
  const rangeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (rangeRef.current) {
      const progress = ((value - min) / (max - min)) * 100;
      rangeRef.current.style.setProperty("--range-progress", `${progress}%`);
    }
  }, [value, min, max]);

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
  };

  return (
    <div className="space-y-3">
      {/* Label row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <label className="text-sm font-bold text-navy-900 leading-snug block">
            {label}
          </label>
          {description && (
            <p className="text-xs text-gray-400 font-medium mt-0.5 leading-snug">
              {description}
            </p>
          )}
        </div>
        {/* Value bubble */}
        <div className="shrink-0 flex items-center gap-1">
          {prefix && (
            <span className="text-sm font-bold text-navy-800">{prefix}</span>
          )}
          <input
            type="number"
            value={value}
            onChange={handleNumberChange}
            min={min}
            max={max}
            step={step}
            className="w-[4.5rem] text-center text-sm font-bold text-navy-900 bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent focus:bg-white transition-colors"
          />
          {suffix && (
            <span className="text-sm font-bold text-navy-800">{suffix}</span>
          )}
        </div>
      </div>

      {/* Slider */}
      <input
        ref={rangeRef}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleRangeChange}
        className="input-range w-full"
        style={
          {
            "--range-progress": `${((value - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
      />

      {/* Min / max labels */}
      <div className="flex justify-between text-[10px] text-gray-400 font-semibold tracking-wide -mt-1">
        <span>{prefix}{min}{suffix}</span>
        <span>{prefix}{max}{suffix}</span>
      </div>
    </div>
  );
}
