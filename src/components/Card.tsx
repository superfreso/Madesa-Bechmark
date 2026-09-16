interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function Card({ title, subtitle, children, className = '', action }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            {title && <h3 className="font-display font-semibold text-gray-900 text-sm">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
