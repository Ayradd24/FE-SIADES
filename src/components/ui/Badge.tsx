import React from 'react';

type BadgeVariant = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'lunas' | 'belum';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  approved: 'bg-green-100 text-green-700 border border-green-200',
  rejected: 'bg-red-100 text-red-700 border border-red-200',
  active: 'bg-green-100 text-green-700 border border-green-200',
  inactive: 'bg-gray-100 text-gray-600 border border-gray-200',
  lunas: 'bg-green-100 text-green-700 border border-green-200',
  belum: 'bg-red-100 text-red-600 border border-red-200',
};

const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
