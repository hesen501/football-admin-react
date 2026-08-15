import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errors';
import { getVenueWorkingHours, updateVenueWorkingHours } from '../../api/venues';
import { DAY_NAMES, Venue, VenueWorkingHour } from '../../types/venue';

interface WorkingHoursModalProps {
  venue: Venue;
  onClose: () => void;
  onSaved: (hours: VenueWorkingHour[]) => void;
}

interface DayFormState {
  day_of_week: number;
  is_closed: boolean;
  opens_at: string;
  closes_at: string;
}

const DEFAULT_OPENS_AT = '08:00';
const DEFAULT_CLOSES_AT = '23:00';

const buildFormState = (hours: VenueWorkingHour[]): DayFormState[] =>
  Array.from({ length: 7 }, (_, day) => {
    const existing = hours.find((h) => h.day_of_week === day);
    return {
      day_of_week: day,
      is_closed: existing?.is_closed ?? false,
      opens_at: existing?.opens_at ?? DEFAULT_OPENS_AT,
      closes_at: existing?.closes_at ?? DEFAULT_CLOSES_AT,
    };
  });

const WorkingHoursModal: React.FC<WorkingHoursModalProps> = ({ venue, onClose, onSaved }) => {
  const { showToast } = useNotification();
  // The venue list/detail responses already embed working_hours, so this
  // only hits the network if that somehow wasn't loaded.
  const [days, setDays] = useState<DayFormState[]>(buildFormState(venue.working_hours || []));
  const [isLoading, setIsLoading] = useState(!venue.working_hours);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (venue.working_hours) return;
    setIsLoading(true);
    getVenueWorkingHours(venue.id)
      .then((hours) => setDays(buildFormState(hours)))
      .catch((err) => showToast(getErrorMessage(err, 'İş saatları yüklənə bilmədi'), 'error'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue.id]);

  const updateDay = (dayOfWeek: number, patch: Partial<DayFormState>) => {
    setDays((prev) => prev.map((d) => (d.day_of_week === dayOfWeek ? { ...d, ...patch } : d)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateVenueWorkingHours(
        venue.id,
        days.map((d) => ({
          day_of_week: d.day_of_week,
          is_closed: d.is_closed,
          opens_at: d.is_closed ? undefined : d.opens_at,
          closes_at: d.is_closed ? undefined : d.closes_at,
        }))
      );
      showToast('İş saatları yeniləndi', 'success');
      onSaved(updated);
      onClose();
    } catch (err) {
      showToast(getErrorMessage(err, 'İş saatları yadda saxlanıla bilmədi'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={`İş Saatları — ${venue.name}`}
      onClose={onClose}
      width="640px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Ləğv et
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? <span className="spinner spinner-sm" /> : 'Saatları Yadda Saxla'}
          </button>
        </>
      }
    >
      {isLoading ? (
        <div className="table-loading">
          <span className="spinner" />
        </div>
      ) : (
        <>
          <p className="form-hint" style={{ marginBottom: 16 }}>
            Bu saatlardan kənar rezervasiyalar rədd edilir — bir günü bağlamaq və ya vaxt aralığını daraltmaq
            müştərilərin həmin məkanda sahə rezervasiya etməsinin qarşısını alır (məs: gecə yarısı).
          </p>
          <div className="working-hours-list">
            {days.map((day) => (
              <div className={`working-hours-row${day.is_closed ? ' is-closed' : ''}`} key={day.day_of_week}>
                <label className="working-hours-day">
                  <input
                    type="checkbox"
                    checked={!day.is_closed}
                    onChange={(e) => updateDay(day.day_of_week, { is_closed: !e.target.checked })}
                  />
                  {DAY_NAMES[day.day_of_week]}
                </label>

                {day.is_closed ? (
                  <span className="badge badge-muted working-hours-closed-badge">Bağlıdır</span>
                ) : (
                  <div className="working-hours-times">
                    <input
                      type="time"
                      className="form-input"
                      required
                      value={day.opens_at}
                      onChange={(e) => updateDay(day.day_of_week, { opens_at: e.target.value })}
                    />
                    <span className="working-hours-sep">–</span>
                    <input
                      type="time"
                      className="form-input"
                      required
                      value={day.closes_at}
                      onChange={(e) => updateDay(day.day_of_week, { closes_at: e.target.value })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
};

export default WorkingHoursModal;
