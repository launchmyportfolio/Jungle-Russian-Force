import React from 'react';

const Table = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
      <table className={`min-w-full divide-y divide-slate-200 text-sm ${className}`}>
        {children}
      </table>
    </div>
  );
};

export default Table;
