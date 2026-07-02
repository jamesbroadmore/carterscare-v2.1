export function Field({ 
  label, 
  value, 
  onChange, 
  error, 
  placeholder, 
  type = "text" 
}: {
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  error?: string; 
  placeholder?: string; 
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 ${error ? "border-destructive" : ""}`}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

export function SelectField({ 
  label, 
  value, 
  onChange, 
  options 
}: {
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
