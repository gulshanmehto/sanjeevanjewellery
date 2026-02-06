/**
 * Empty state components for better UX when no data is available
 */

import { Image, History, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EmptyState = ({ 
  icon: Icon = Image, 
  title, 
  description, 
  action, 
  actionLabel 
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
      {title}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
      {description}
    </p>
    {action && actionLabel && (
      <Button onClick={action} variant="premium">
        {actionLabel}
      </Button>
    )}
  </div>
);

export const NoHistory = ({ onCreateNew }) => (
  <EmptyState
    icon={History}
    title="No generation history"
    description="You haven't created any AI photoshoots yet. Start by uploading your first jewellery image."
    action={onCreateNew}
    actionLabel="Create Your First Photoshoot"
  />
);

export const NoPresetSelected = () => (
  <EmptyState
    icon={Sparkles}
    title="Select a preset"
    description="Choose a preset style to see how your jewellery will look in different photography settings."
  />
);
