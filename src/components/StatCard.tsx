interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, sublabel, accent, icon }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 transition-shadow hover:shadow-sm ${
        accent ? 'bg-madesa-600 border-madesa-600 text-white' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className={`text-xs font-medium uppercase tracking-wider ${accent ? 'text-madesa-100' : 'text-gray-400'}`}>
            {label}
          </p>
          <p className={`mt-2 font-display font-bold text-2xl ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          {sublabel && (
            <p className={`mt-1 text-xs ${accent ? 'text-madesa-100' : 'text-gray-400'}`}>{sublabel}</p>
          )}
        </div>
        {icon && <div className={accent ? 'text-madesa-200' : 'text-gray-300'}>{icon}</div>}
      </div>
    </div>
  );
}
