import { useState } from 'react';
import type { DailyFocus } from '../../services/focusStatisticsService';
import { activityColor, calendarPadding } from '../study/chartPresentation';

/** Browse the actual 365-day series by month; never fills absent days with estimates. */
export function RecordedCalendar({ activity }: { activity: DailyFocus[] }) {
    const months = [...new Set(activity.map(item => item.date.slice(0, 7)))];
    const [chosen, setChosen] = useState(months.at(-1));
    const [selected, setSelected] = useState<string | null>(null);
    const month = chosen && months.includes(chosen) ? chosen : months.at(-1);
    const index = months.indexOf(month ?? '');
    const days = activity.filter(item => item.date.startsWith(month ?? '!'));
    const day = activity.find(item => item.date === selected);
    return <section className="dashboard-calendar study-panel min-w-0 space-y-3" aria-label="Recorded activity calendar">
        <h3 className="text-lg font-semibold text-content">Activity calendar</h3>
        <p className="text-xs text-content-muted">{activity[0]?.date} – {activity.at(-1)?.date} · recorded time, including historical estimates.</p>
        <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="study-button" aria-label="Previous activity month" disabled={index <= 0} onClick={() => { setChosen(months[index - 1]); setSelected(null); }}>←</button>
            <label className="min-w-0 flex-1 text-sm"><span className="sr-only">Activity month</span><select aria-label="Activity month" value={month ?? ''} disabled={!months.length}
                onChange={event => { setChosen(event.target.value); setSelected(null); }} className="min-h-11 w-full rounded-control border border-outline bg-surface px-2">
                {months.map(value => <option key={value} value={value}>{new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + '-15T12:00:00Z'))}</option>)}
            </select></label>
            <button type="button" className="study-button" aria-label="Next activity month" disabled={index < 0 || index >= months.length - 1} onClick={() => { setChosen(months[index + 1]); setSelected(null); }}>→</button>
        </div>
        <div className="grid grid-cols-7 gap-1" aria-label="Recorded days">
            {['M','T','W','T','F','S','S'].map((value,i) => <span aria-hidden="true" key={'label'+i} className="text-center text-xs text-content-muted">{value}</span>)}
            {Array.from({ length: calendarPadding(days[0]?.date) }, (_,i) => <span aria-hidden="true" key={'pad'+i}/>)}
            {days.map(item => <button key={item.date} type="button" aria-label={`${item.date}: ${item.minutes} minutes, ${item.sessions} sessions`}
                aria-pressed={selected === item.date} onFocus={() => setSelected(item.date)} onClick={() => setSelected(item.date)}
                className="min-h-11 min-w-0 rounded-control border border-outline text-sm font-semibold text-content"
                style={{ backgroundColor: activityColor(item.minutes), color: item.minutes >= 30 ? 'var(--ss-on-accent)' : undefined, outline: selected === item.date ? '2px solid var(--ss-accent)' : undefined }}>
                {Number(item.date.slice(-2))}
            </button>)}
        </div>
        {!days.length && <p className="text-sm text-content-muted">No recorded activity dates available.</p>}
        <p aria-live="polite" className="text-xs text-content-muted">{day ? `${day.date} · ${day.minutes} min · ${day.sessions} sessions` : 'Select a day for its recorded value.'}</p>
        <p className="text-xs text-content-muted">Intensity: 0 · 1–29 · 30–59 · 60+ min</p>
    </section>;
}
