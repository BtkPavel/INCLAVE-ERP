import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CalendarEvent, CreateEventDto, EventType } from '../../../api/types/calendar';
import type { Task } from '../../../api/types/tasks';
import { calendarApi } from '../../../api/modules/calendar.api';
import { tasksApi } from '../../../api/modules/tasks.api';
import { apiClient } from '../../../api/client';
import { ApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/AuthContext';
import { setTasksAssignee } from '../../../backend/tasks/tasksService';
import { clearReminderForEvent, scheduleReminderCheck } from '../reminders/eventReminders';
import { eventsStorage } from '../storage/eventsStorage';
import {
  addDays,
  addMonths,
  addYears,
  getWeekDays,
  isSameDay,
  startOfDay,
  toDateKey,
} from '../utils/dates';
import { compareByPriority } from '../utils/priority';
import { getHolidaysOnDate } from '../holidays/publicHolidays';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'year';

const TASKS_STORAGE_KEY = 'inclave-erp-tasks';

export function useCalendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewDate, setViewDate] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const eventsRef = useRef<CalendarEvent[]>([]);
  eventsRef.current = events;

  useEffect(() => {
    if (user) {
      setTasksAssignee(user.role);
    }
  }, [user]);

  const range = useMemo(() => {
    switch (viewMode) {
      case 'day': {
        const day = startOfDay(viewDate);
        return { from: day.toISOString(), to: addDays(day, 1).toISOString() };
      }
      case 'week': {
        const days = getWeekDays(viewDate);
        return { from: days[0].toISOString(), to: addDays(days[6], 1).toISOString() };
      }
      case 'year':
        return eventsStorage.yearRange(viewDate);
      default:
        return eventsStorage.monthRange(viewDate);
    }
  }, [viewDate, viewMode]);

  const loadCalendarData = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setTasksAssignee(user.role);
      const [eventsRes, tasksRes] = await Promise.all([
        calendarApi.listEvents({
          from: range.from,
          to: range.to,
          perPage: 500,
        }),
        tasksApi.listWithDueDate(),
      ]);
      setEvents(eventsRes.data);
      setTasks(tasksRes.data);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, user]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  useEffect(() => {
    if (!saveNotice) return;
    const timer = window.setTimeout(() => setSaveNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === TASKS_STORAGE_KEY) {
        loadCalendarData();
      }
    }

    function handleFocus() {
      loadCalendarData();
    }

    function handleAssistantAction() {
      loadCalendarData();
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('inclave-assistant-action', handleAssistantAction);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('inclave-assistant-action', handleAssistantAction);
    };
  }, [loadCalendarData]);

  useEffect(() => {
    return scheduleReminderCheck(() =>
      apiClient.isMockMode() ? eventsStorage.listAll() : eventsRef.current,
    );
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = toDateKey(new Date(event.startAt));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const byPriority = compareByPriority(a.priority ?? 'medium', b.priority ?? 'medium');
        if (byPriority !== 0) return byPriority;
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      });
    }
    return map;
  }, [events]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const list = map.get(task.dueDate) ?? [];
      list.push(task);
      map.set(task.dueDate, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    }
    return map;
  }, [tasks]);

  const selectedDayEvents = useMemo(() => {
    return eventsByDate.get(toDateKey(selectedDate)) ?? [];
  }, [eventsByDate, selectedDate]);

  const selectedDayTasks = useMemo(() => {
    return tasksByDate.get(toDateKey(selectedDate)) ?? [];
  }, [tasksByDate, selectedDate]);

  const selectedDayHolidays = useMemo(() => {
    return getHolidaysOnDate(selectedDate);
  }, [selectedDate]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    const source = apiClient.isMockMode() ? eventsStorage.listAll() : events;
    return [...source]
      .filter((e) => new Date(e.startAt).getTime() >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 5);
  }, [events]);

  const upcomingTasks = useMemo(() => {
    const today = toDateKey(new Date());
    return [...tasks]
      .filter((task) => task.dueDate && task.dueDate >= today && task.status !== 'done')
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
      .slice(0, 5);
  }, [tasks]);

  function goToday() {
    const today = startOfDay(new Date());
    setViewDate(today);
    setSelectedDate(today);
  }

  function goPrev() {
    setViewDate((d) => {
      switch (viewMode) {
        case 'day':
          return addDays(d, -1);
        case 'week':
          return addDays(d, -7);
        case 'year':
          return addYears(d, -1);
        default:
          return addMonths(d, -1);
      }
    });
  }

  function goNext() {
    setViewDate((d) => {
      switch (viewMode) {
        case 'day':
          return addDays(d, 1);
        case 'week':
          return addDays(d, 7);
        case 'year':
          return addYears(d, 1);
        default:
          return addMonths(d, 1);
      }
    });
  }

  function changeViewMode(mode: CalendarViewMode) {
    if (mode === 'day') {
      setViewDate(selectedDate);
    }
    setViewMode(mode);
  }

  function selectDate(date: Date) {
    const day = startOfDay(date);
    setSelectedDate(day);
    if (viewMode === 'day') setViewDate(day);
  }

  function selectMonth(monthIndex: number) {
    const month = new Date(viewDate.getFullYear(), monthIndex, 1);
    setViewDate(month);
    setSelectedDate(month);
    setViewMode('month');
  }

  function openCreate(date?: Date) {
    setEditingEvent(null);
    if (date) {
      const day = startOfDay(date);
      setSelectedDate(day);
      if (viewMode === 'day') setViewDate(day);
    }
    setModalOpen(true);
  }

  function openEdit(event: CalendarEvent) {
    setEditingEvent(event);
    const day = startOfDay(new Date(event.startAt));
    setSelectedDate(day);
    if (viewMode === 'day') setViewDate(day);
    setModalOpen(true);
  }

  function openTask(_task: Task) {
    navigate('/tasks');
  }

  function closeModal() {
    setModalOpen(false);
    setEditingEvent(null);
  }

  function mergeSavedEvent(saved: CalendarEvent) {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== saved.id);
      next.push(saved);
      next.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      return next;
    });
  }

  async function saveEvent(dto: CreateEventDto) {
    if (!apiClient.isMockMode() && !localStorage.getItem('inclave-erp-token')) {
      throw new ApiError(401, {
        code: 'UNAUTHORIZED',
        message: 'Войдите в систему заново',
      });
    }

    let saved: CalendarEvent;
    if (editingEvent) {
      clearReminderForEvent(editingEvent.id);
      saved = (await calendarApi.updateEvent(editingEvent.id, dto)).data;
    } else {
      saved = (await calendarApi.createEvent(dto)).data;
    }

    const eventDay = startOfDay(new Date(saved.startAt));
    setViewDate(eventDay);
    setSelectedDate(eventDay);
    mergeSavedEvent(saved);
    setSaveNotice(`Событие «${saved.title}» сохранено`);
    closeModal();
  }

  async function removeEvent(id: string) {
    clearReminderForEvent(id);
    await calendarApi.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    closeModal();
  }

  function getEventsForDay(date: Date): CalendarEvent[] {
    return eventsByDate.get(toDateKey(date)) ?? [];
  }

  function getTasksForDay(date: Date): Task[] {
    return tasksByDate.get(toDateKey(date)) ?? [];
  }

  function getHolidaysForDay(date: Date) {
    return getHolidaysOnDate(date);
  }

  return {
    viewDate,
    selectedDate,
    viewMode,
    setViewMode: changeViewMode,
    events,
    tasks,
    loading,
    modalOpen,
    editingEvent,
    saveNotice,
    selectedDayEvents,
    selectedDayTasks,
    selectedDayHolidays,
    upcomingEvents,
    upcomingTasks,
    goToday,
    goPrev,
    goNext,
    selectDate,
    selectMonth,
    openCreate,
    openEdit,
    openTask,
    closeModal,
    saveEvent,
    removeEvent,
    getEventsForDay,
    getTasksForDay,
    getHolidaysForDay,
    isSelected: (date: Date) => isSameDay(date, selectedDate),
  };
}

export type { EventType };
