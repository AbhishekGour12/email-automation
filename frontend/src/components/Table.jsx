import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye, EyeOff, Search } from 'lucide-react';
import Button from './Button';

const Table = ({
  columns = [],
  data = [],
  pagination = null, // { total, page, limit, totalPages, onPageChange }
  onSearch = null,
  bulkActions = [], // [ { label, onClick, variant } ]
  onRowClick = null,
  selectable = true,
  isLoading = false,
  emptyMessage = 'No records found'
}) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(columns.map((c) => c.accessor))
  );
  const [searchVal, setSearchVal] = useState('');
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  // Sorting logic (in-memory fallback if not server-sorted)
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    
    const sorted = [...data];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

  const handleSort = (accessor) => {
    let direction = 'asc';
    if (sortConfig.key === accessor && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: accessor, direction });
  };

  // Bulk Selection helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = new Set(data.map((row) => row.id || row._id));
      setSelectedIds(ids);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (e, rowId) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected = data.length > 0 && selectedIds.size === data.length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchVal);
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Search bar */}
          {onSearch && (
            <form onSubmit={handleSearchSubmit} className="relative max-w-xs">
              <input
                type="text"
                placeholder="Search..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-64 pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </form>
          )}

          {/* Column Toggle Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnToggle(!showColumnToggle)}
            >
              Columns
            </Button>
            {showColumnToggle && (
              <div className="absolute left-0 mt-2 z-50 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2">
                <p className="text-xs font-semibold text-slate-400 px-2 py-1">Toggle Columns</p>
                {columns.map((col) => (
                  <label
                    key={col.accessor}
                    className="flex items-center gap-2 px-2 py-1 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col.accessor)}
                      onChange={() => {
                        const newVisible = new Set(visibleColumns);
                        if (newVisible.has(col.accessor)) {
                          if (newVisible.size > 1) { // keep at least 1 column
                            newVisible.delete(col.accessor);
                          }
                        } else {
                          newVisible.add(col.accessor);
                        }
                        setVisibleColumns(newVisible);
                      }}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    {col.header}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && bulkActions.length > 0 && (
          <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-950/20 px-3 py-1.5 rounded-lg border border-primary-200 dark:border-primary-900/50">
            <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
              {selectedIds.size} selected
            </span>
            {bulkActions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => {
                  action.onClick(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Main Table container */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-premium bg-white dark:bg-slate-900">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {selectable && (
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                </th>
              )}
              {columns
                .filter((col) => visibleColumns.has(col.accessor))
                .map((col) => (
                  <th
                    key={col.accessor}
                    onClick={() => col.sortable !== false && handleSort(col.accessor)}
                    className={`py-3 px-4 select-none ${
                      col.sortable !== false ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {sortConfig.key === col.accessor && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton loaders
              [...Array(5)].map((_, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-800/50">
                  {selectable && (
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </td>
                  )}
                  {columns
                    .filter((col) => visibleColumns.has(col.accessor))
                    .map((col, cIdx) => (
                      <td key={cIdx} className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.filter((c) => visibleColumns.has(c.accessor)).length + (selectable ? 1 : 0)}
                  className="py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-medium"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rIdx) => {
                const rowId = row.id || row._id;
                const isSelected = selectedIds.has(rowId);
                return (
                  <tr
                    key={rowId || rIdx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`border-b border-slate-100 dark:border-slate-800/50 text-sm text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${isSelected ? 'bg-primary-50/30 dark:bg-primary-950/10' : ''}`}
                  >
                    {selectable && (
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(e, rowId)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                        />
                      </td>
                    )}
                    {columns
                      .filter((col) => visibleColumns.has(col.accessor))
                      .map((col) => (
                        <td key={col.accessor} className="py-3.5 px-4 whitespace-nowrap">
                          {col.render ? col.render(row[col.accessor], row) : row[col.accessor] || '-'}
                        </td>
                      ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {pagination && (
        <div className="flex items-center justify-between px-1 text-sm text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-bold">{data.length}</span> of{' '}
            <span className="font-bold">{pagination.total}</span> records
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="p-1 rounded-md"
                disabled={pagination.page <= 1}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="p-1 rounded-md"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
