import { useEffect, useState, type FormEvent } from 'react';
import type {
  CalendarEvent,
  CreateEventDto,
  EventType,
  EventPriority,
  ReminderMinutes,
} from '../../../api/types/calendar';
import { requestNotificationPermission } from '../../../notifications/notifications';
import { DatePicker } from '../../../components/DatePicker';
import { FormSelect } from '../../../components/FormSelect';
import { EVENT_TYPE_LABELS, EVENT_PRIORITY_LABELS, REMINDER_OPTIONS } from '../constants';
import { parseTimeFromISO, toDateKey, toISODateTime } from '../utils/dates';
import styles from './EventModal.module.css';

interface EventModalProps {
  open: boolean;
  selectedDate: Date;
  event: CalendarEvent | null;
  onClose: () => void;
  onSave: (dto: CreateEventDto) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const TYPES = Object.keys(EVENT_TYPE_LABELS) as EventType[];
const PRIORITIES = Object.keys(EVENT_PRIORITY_LABELS) as EventPriority[];

export function EventModal({
  open,
  selectedDate,
  event,
  onClose,
  onSave,
  onDelete,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('meeting');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [allDay, setAllDay] = useState(false);
  const [description, setDescription] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<ReminderMinutes | null>(null);
  const [priority, setPriority] = useState<EventPriority>('medium');
  const [reminderHint, setReminderHint] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReminderHint('');
    if (event) {
      setTitle(event.title);
      setType(event.type);
      setDate(toDateKey(new Date(event.startAt)));
      const start = parseTimeFromISO(event.startAt);
      const end = parseTimeFromISO(event.endAt);
      setStartTime(`${String(start.hours).padStart(2, '0')}:${String(start.minutes).padStart(2, '0')}`);
      setEndTime(`${String(end.hours).padStart(2, '0')}:${String(end.minutes).padStart(2, '0')}`);
      setAllDay(event.allDay);
      setDescription(event.description ?? '');
      setReminderMinutes(event.reminderMinutes);
      setPriority(event.priority ?? 'medium');
    } else {
      setTitle('');
      setType('meeting');
      setDate(toDateKey(selectedDate));
      setStartTime('10:00');
      setEndTime('11:00');
      setAllDay(false);
      setDescription('');
      setReminderMinutes(null);
      setPriority('medium');
    }
  }, [open, event, selectedDate]);

  if (!open) return null;

  async function handleReminderChange(value: string) {
    if (value === '') {
      setReminderMinutes(null);
      setReminderHint('');
      return;
    }

    const minutes = Number(value) as ReminderMinutes;
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') {
      setReminderHint('Разрешите уведомления в браузере, чтобы получать напоминания');
    } else {
      setReminderHint('');
    }
    setReminderMinutes(minutes);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const baseDate = new Date(date + 'T00:00:00');

    const dto: CreateEventDto = {
      title: title.trim(),
      type,
      description: description.trim() || undefined,
      startAt: allDay
        ? toISODateTime(baseDate, 0, 0)
        : toISODateTime(baseDate, sh, sm),
      endAt: allDay
        ? toISODateTime(baseDate, 23, 59)
        : toISODateTime(baseDate, eh, em),
      allDay,
      reminderMinutes,
      priority: allDay ? (priority ?? 'medium') : priority,
    };

    setSaving(true);
    try {
      await onSave(dto);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event || !onDelete) return;
    setSaving(true);
    try {
      await onDelete(event.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
      >
        <header className={styles.header}>
          <h2 id="event-modal-title" className={styles.title}>
            {event ? 'Редактировать событие' : 'Новое событие'}
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Название</span>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Совещание, дедлайн…"
              required
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Тип</span>
            <FormSelect value={type} onChange={(v) => setType(v as EventType)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {EVENT_TYPE_LABELS[t]}
                </option>
              ))}
            </FormSelect>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Дата</span>
            <DatePicker value={date} onChange={setDate} required />
          </label>

          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            <span>Весь день</span>
          </label>

          {!allDay && (
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>Начало</span>
                <input
                  type="time"
                  className={styles.input}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Конец</span>
                <input
                  type="time"
                  className={styles.input}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </label>
            </div>
          )}

          {!allDay && (
            <label className={styles.field}>
              <span className={styles.label}>Приоритет</span>
              <FormSelect value={priority} onChange={(v) => setPriority(v as EventPriority)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {EVENT_PRIORITY_LABELS[p]}
                  </option>
                ))}
              </FormSelect>
            </label>
          )}

          <label className={styles.field}>
            <span className={styles.label}>Напоминание</span>
            <FormSelect
              value={reminderMinutes === null ? '' : String(reminderMinutes)}
              onChange={(v) => handleReminderChange(v)}
            >
              {REMINDER_OPTIONS.map((opt) => (
                <option key={String(opt.value)} value={opt.value === null ? '' : String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
            {reminderHint && <span className={styles.hint}>{reminderHint}</span>}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Описание</span>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительные детали…"
              rows={3}
            />
          </label>

          <div className={styles.actions}>
            {event && onDelete && (
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={handleDelete}
                disabled={saving}
              >
                Удалить
              </button>
            )}
            <div className={styles.actionsRight}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
