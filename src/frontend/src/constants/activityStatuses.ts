// Shared source of truth for Activity status values and display configuration
export const ACTIVITY_STATUSES = {
  BACKLOG: 'Backlog',
  PLANNING: 'Planning',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
} as const;

export type ActivityStatus = typeof ACTIVITY_STATUSES[keyof typeof ACTIVITY_STATUSES];

export const ACTIVITY_STATUS_COLORS: Record<string, string> = {
  [ACTIVITY_STATUSES.BACKLOG]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  [ACTIVITY_STATUSES.PLANNING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [ACTIVITY_STATUSES.SCHEDULED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [ACTIVITY_STATUSES.IN_PROGRESS]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [ACTIVITY_STATUSES.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

// Simple view: 3 columns
export const SIMPLE_COLUMNS = [
  { id: ACTIVITY_STATUSES.BACKLOG, label: 'Backlog', statuses: [ACTIVITY_STATUSES.BACKLOG, ACTIVITY_STATUSES.PLANNING] },
  { id: ACTIVITY_STATUSES.IN_PROGRESS, label: 'Doing', statuses: [ACTIVITY_STATUSES.SCHEDULED, ACTIVITY_STATUSES.IN_PROGRESS] },
  { id: ACTIVITY_STATUSES.COMPLETED, label: 'Done', statuses: [ACTIVITY_STATUSES.COMPLETED] },
];

// Detailed view: 5 columns
export const DETAILED_COLUMNS = [
  { id: ACTIVITY_STATUSES.BACKLOG, label: 'Backlog', statuses: [ACTIVITY_STATUSES.BACKLOG] },
  { id: ACTIVITY_STATUSES.PLANNING, label: 'Planning', statuses: [ACTIVITY_STATUSES.PLANNING] },
  { id: ACTIVITY_STATUSES.SCHEDULED, label: 'Scheduled', statuses: [ACTIVITY_STATUSES.SCHEDULED] },
  { id: ACTIVITY_STATUSES.IN_PROGRESS, label: 'In Progress', statuses: [ACTIVITY_STATUSES.IN_PROGRESS] },
  { id: ACTIVITY_STATUSES.COMPLETED, label: 'Completed', statuses: [ACTIVITY_STATUSES.COMPLETED] },
];

export const ALL_STATUS_OPTIONS = Object.values(ACTIVITY_STATUSES);
