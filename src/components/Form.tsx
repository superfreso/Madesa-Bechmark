interface FieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-madesa-500 focus:border-madesa-500 transition-all ${props.className || ''}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-madesa-500 focus:border-madesa-500 transition-all resize-none ${props.className || ''}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-madesa-500 focus:border-madesa-500 transition-all cursor-pointer bg-white ${props.className || ''}`}
    />
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-madesa-600 text-white hover:bg-madesa-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'text-gray-500 hover:bg-gray-100',
  };
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
