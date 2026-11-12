import { Link } from 'react-router-dom';
import { AcademicSprite } from '../academic/AcademicSprite';
import type { DailyRecord } from '../../types/dailyRecord';
import { dailyRecordDetailsPath } from '../../routes/paths';
export default function DailyRecordCard({ dailyRecord, goalId }: { dailyRecord: DailyRecord; goalId: number }) {
    return <article className="goal-workflow-card"><Link to={dailyRecordDetailsPath(goalId,dailyRecord.id)} className="goal-card-main" aria-label={`Open record ${dailyRecord.date}`}>
        <AcademicSprite name="notebook" width={40}/><div className="min-w-0 flex-1"><h2 className="font-semibold text-content">{dailyRecord.date}</h2><p className="mt-2 line-clamp-2 break-words text-sm text-content-secondary">{dailyRecord.note || 'No note'}</p><p className="mt-2 text-xs text-content-muted">{dailyRecord.photoAvailable ? 'Photo saved' : 'No photo'} · {dailyRecord.voiceAvailable ? 'Voice note saved' : 'No voice note'}</p><p className="mt-2 text-sm font-medium text-accent">View record & evidence →</p></div>
    </Link></article>;
}
