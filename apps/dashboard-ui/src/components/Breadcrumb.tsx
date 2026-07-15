import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className="flex items-center flex-wrap gap-1 text-sm mb-5">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
            )}
            {isLast || !item.to ? (
              <span
                className={`font-medium truncate max-w-[160px] ${isLast ? 'text-gray-800' : 'text-gray-500'}`}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-[160px] transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};
