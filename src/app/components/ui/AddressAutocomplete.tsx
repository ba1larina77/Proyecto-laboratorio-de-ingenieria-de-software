import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface PhotonFeature {
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

function formatSuggestion(f: PhotonFeature): string {
  const p = f.properties;
  const parts: string[] = [];
  if (p.name) parts.push(p.name);
  else if (p.street) parts.push(p.housenumber ? `${p.street} ${p.housenumber}` : p.street);
  if (p.city && p.city !== p.name) parts.push(p.city);
  if (p.state) parts.push(p.state);
  if (p.country) parts.push(p.country);
  return parts.join(", ");
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

export function AddressAutocomplete({
  value, onChange, onBlur, placeholder, className, style, disabled, required, name, id
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=default&limit=5`
      );
      const data = await res.json();
      const items: string[] = (data.features as PhotonFeature[])
        .map(formatSuggestion)
        .filter(Boolean);
      setSuggestions(items);
      setOpen(items.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(v), 350);
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div ref={containerRef} className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4A373] pointer-events-none z-10 [&>svg]:w-4 [&>svg]:h-4">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
      </span>
      <input
        name={name}
        id={id}
        value={value}
        onChange={handleInput}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        className={className}
        style={style}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-[999] left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-[#E8C99A] overflow-hidden max-h-52 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-xs hover:bg-[#F5EDD3] transition-colors flex items-start gap-2"
                style={{ color: "#4A3728" }}
                onMouseDown={e => { e.preventDefault(); handleSelect(s); }}
              >
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#D4A373]" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
