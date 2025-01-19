import { differenceInDays, addDays, addWeeks, addMonths } from 'date-fns';

export type TimeScale = 'daily' | 'weekly' | 'monthly';

export interface TimelineConfig {
  scale: TimeScale;
  pixelsPerUnit: number;
  startDate: Date;
}

// Base unit is daily
const BASE_UNIT_WIDTH = 50;

export function getTimelineConfig(scale: number): TimeScale {
  if (scale < 0.5) return 'monthly';
  if (scale < 1) return 'weekly';
  return 'daily';
}

export function getPixelsPerUnit(scale: TimeScale): number {
  switch (scale) {
    case 'monthly': return BASE_UNIT_WIDTH * 30;  // Approximate month in days
    case 'weekly': return BASE_UNIT_WIDTH * 7;    // Week in days
    case 'daily': return BASE_UNIT_WIDTH;         // Base unit
  }
}

export function formatDate(date: Date, scale: TimeScale): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric'
  };
  if (scale === 'monthly') options.year = 'numeric';
  return date.toLocaleDateString(undefined, options);
}

export function dateToX(date: Date, config: TimelineConfig): number {
  const { scale, pixelsPerUnit, startDate } = config;
  const diffTime = date.getTime() - startDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  switch (scale) {
    case 'monthly':
      const diffMonths = (date.getFullYear() - startDate.getFullYear()) * 12 + 
        (date.getMonth() - startDate.getMonth());
      return diffMonths * pixelsPerUnit;
    case 'weekly':
      return Math.floor(diffDays / 7) * pixelsPerUnit;
    case 'daily':
      return diffDays * pixelsPerUnit;
  }
}

export function xToDate(x: number, config: TimelineConfig): Date {
  const { scale, pixelsPerUnit, startDate } = config;
  const gridIndex = Math.round(x / pixelsPerUnit);
  
  const result = new Date(startDate);
  switch (scale) {
    case 'monthly':
      result.setMonth(result.getMonth() + gridIndex);
      break;
    case 'weekly':
      result.setDate(result.getDate() + gridIndex * 7);
      break;
    case 'daily':
      result.setDate(result.getDate() + gridIndex);
      break;
  }
  return result;
}

export function snapToGrid(x: number, config: TimelineConfig): number {
  const { pixelsPerUnit } = config;
  console.log('Timeline Snap:', {
    x,
    pixelsPerUnit,
    gridIndex: Math.round(x / pixelsPerUnit),
    result: Math.round(x / pixelsPerUnit) * pixelsPerUnit
  });
  const gridIndex = Math.round(x / pixelsPerUnit);
  return gridIndex * pixelsPerUnit;
} 