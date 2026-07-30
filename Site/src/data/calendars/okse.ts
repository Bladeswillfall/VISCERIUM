import { okseCalendar as runtimeCalendar } from './okse.mjs';
import type { CalendarDefinition } from '../../lib/calendar/types';

export const okseCalendar = runtimeCalendar as CalendarDefinition;
