import React from 'react';

interface Props {
  title: string;
  children: React.ReactNode;
}

const StatsSection: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-4">
      <h3 className="font-medium mb-2 text-sm text-neutral-700 dark:text-neutral-300">{title}</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">{children}</div>
    </div>
  );
};

export default StatsSection;
