import type { CSSProperties } from 'react';
import { CalendarDayView } from './CalendarDayView';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarSidebar } from './CalendarSidebar';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarWeekGrid } from './CalendarWeekGrid';
import { CalendarYearGrid } from './CalendarYearGrid';
import { EventModal } from './EventModal';
import { EVENT_PRIORITY_COLORS } from '../constants';
import { useCalendar } from '../hooks/useCalendar';
import styles from './CalendarView.module.css';

export function CalendarView() {
  const calendar = useCalendar();

  function handleYearDaySelect(date: Date) {
    calendar.selectDate(date);
    calendar.setViewMode('day');
  }

  return (
    <div className={styles.view}>
      <CalendarToolbar
        viewDate={calendar.viewDate}
        viewMode={calendar.viewMode}
        onViewModeChange={calendar.setViewMode}
        onPrev={calendar.goPrev}
        onNext={calendar.goNext}
        onToday={calendar.goToday}
        onCreate={() => calendar.openCreate()}
      />

      {calendar.saveNotice && (
        <p className={styles.saveNotice} role="status">
          {calendar.saveNotice}
        </p>
      )}

      <div className={styles.legend}>
        <p className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendHoliday}`} aria-hidden />
          Гос. праздники РБ и РФ
        </p>
        <p className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendTask}`} aria-hidden />
          Задачи со сроком
        </p>
        <p className={styles.legendItem}>
          <span className={styles.legendText}>Приоритет событий:</span>
          {(Object.entries(EVENT_PRIORITY_COLORS) as [keyof typeof EVENT_PRIORITY_COLORS, string][]).map(
            ([key, color]) => (
              <span key={key} className={styles.legendPriority} style={{ '--priority-color': color } as CSSProperties}>
                <span className={styles.legendDot} aria-hidden />
              </span>
            ),
          )}
          <span className={styles.legendText}>срочный → низкий</span>
        </p>
      </div>

      <div className={styles.body}>
        <div className={styles.main}>
          {calendar.loading && (
            <div className={styles.loading} aria-live="polite">
              <span className={styles.spinner} />
            </div>
          )}

          {calendar.viewMode === 'day' && (
            <CalendarDayView
              date={calendar.viewDate}
              events={calendar.getEventsForDay(calendar.viewDate)}
              tasks={calendar.getTasksForDay(calendar.viewDate)}
              holidays={calendar.getHolidaysForDay(calendar.viewDate)}
              onEventClick={calendar.openEdit}
              onTaskClick={calendar.openTask}
              onCreate={() => calendar.openCreate(calendar.viewDate)}
            />
          )}

          {calendar.viewMode === 'week' && (
            <CalendarWeekGrid
              viewDate={calendar.viewDate}
              getEventsForDay={calendar.getEventsForDay}
              getTasksForDay={calendar.getTasksForDay}
              getHolidaysForDay={calendar.getHolidaysForDay}
              isSelected={calendar.isSelected}
              onSelectDate={calendar.selectDate}
              onEventClick={calendar.openEdit}
              onTaskClick={calendar.openTask}
            />
          )}

          {calendar.viewMode === 'month' && (
            <CalendarMonthGrid
              viewDate={calendar.viewDate}
              getEventsForDay={calendar.getEventsForDay}
              getTasksForDay={calendar.getTasksForDay}
              getHolidaysForDay={calendar.getHolidaysForDay}
              isSelected={calendar.isSelected}
              onSelectDate={calendar.selectDate}
              onCreateOnDate={calendar.openCreate}
              onEventClick={calendar.openEdit}
              onTaskClick={calendar.openTask}
            />
          )}

          {calendar.viewMode === 'year' && (
            <CalendarYearGrid
              year={calendar.viewDate}
              getEventsForDay={calendar.getEventsForDay}
              getTasksForDay={calendar.getTasksForDay}
              selectedDate={calendar.selectedDate}
              onSelectDate={handleYearDaySelect}
              onSelectMonth={calendar.selectMonth}
            />
          )}
        </div>

        {calendar.viewMode !== 'year' && (
          <CalendarSidebar
            selectedDate={calendar.selectedDate}
            dayEvents={calendar.selectedDayEvents}
            dayTasks={calendar.selectedDayTasks}
            dayHolidays={calendar.selectedDayHolidays}
            upcomingEvents={calendar.upcomingEvents}
            upcomingTasks={calendar.upcomingTasks}
            onCreate={() => calendar.openCreate(calendar.selectedDate)}
            onEventClick={calendar.openEdit}
            onTaskClick={calendar.openTask}
          />
        )}
      </div>

      <EventModal
        open={calendar.modalOpen}
        selectedDate={calendar.selectedDate}
        event={calendar.editingEvent}
        onClose={calendar.closeModal}
        onSave={calendar.saveEvent}
        onDelete={calendar.removeEvent}
      />
    </div>
  );
}
