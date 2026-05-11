import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type PrimaryLinkProps = {
  to: string;
  children: ReactNode;
  variant?: 'solid' | 'ghost';
};

export function PrimaryLink({ to, children, variant = 'solid' }: PrimaryLinkProps) {
  const className =
    variant === 'solid'
      ? 'bg-brass text-ink hover:bg-[#e6bc72]'
      : 'border border-white/15 text-white hover:bg-white/10';

  return (
    <Link to={to} className={`inline-flex items-center justify-center rounded-md px-5 py-3 font-semibold ${className}`}>
      {children}
    </Link>
  );
}
