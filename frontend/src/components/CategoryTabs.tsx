import React from 'react';
import { Category } from '../types';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  totalItemsCount?: number;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  totalItemsCount
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      overflowX: 'auto',
      paddingBottom: '0.5rem',
      scrollbarWidth: 'thin'
    }}>
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`cat-pill ${selectedCategoryId === null ? 'active' : ''}`}
      >
        All Menu ({totalItemsCount ?? categories.reduce((acc, c) => acc + (c.item_count || 0), 0)})
      </button>

      {categories.map(cat => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelectCategory(cat.id)}
          className={`cat-pill ${selectedCategoryId === cat.id ? 'active' : ''}`}
        >
          {cat.name} {cat.item_count !== undefined ? `(${cat.item_count})` : ''}
        </button>
      ))}
    </div>
  );
};
