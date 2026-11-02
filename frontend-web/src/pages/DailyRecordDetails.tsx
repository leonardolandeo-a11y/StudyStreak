import axios from 'axios';
import { createValidation, getValidation, updateValidation } from '../services/validationService';
import ValidationForm from '../components/validations/ValidationForm';
import type { ValidationRequest } from '../types/validation';
import type { Validation } from '../types/validation';
import {
    useEffect,
    useState
}from "react";

import {
    useParams,
    useNavigate,
    useSearchParams
} from "react-router-dom";
import {
    getDailyRecord,
    updateDailyRecord,
    deleteDailyRecord
} from "../services/dailyRecordService";

import type{
    DailyRecord,
    DailyRecordRequest
} from "../types/dailyRecord";

import DailyRecordForm from "../components/dailyRecords/DailyRecordForm";
import RecordPhoto from "../components/dailyRecords/RecordPhoto";
import RecordVoice from "../components/dailyRecords/RecordVoice";

import {
    dailyRecordsPath
} from "../routes/paths";

import LoadingState
    from "../components/ui/LoadingState";

import ErrorMessage
    from "../components/ui/ErrorMessage";

import EmptyState
    from "../components/ui/EmptyState";

import { useToast } from "../hooks/useToast";
import { validationLookupState } from "../utils/validationAccess";
import { useConfirm } from "../hooks/useConfirm";

function DailyRecordDetails(){
    const {goalId,dailyRecordId} = useParams();
    const [searchParams] = useSearchParams();
    const reviewRequested = searchParams.get('review') === '1';
    const [reviewSaving, setReviewSaving] = useState(false);
    const [reviewRevision, setReviewRevision] = useState(0);
    const [evidenceRevision, setEvidenceRevision] = useState(0);

    const [dailyRecord, setDailyRecord] =useState<DailyRecord | null>(null);

    const [loading, setLoading] =useState(true);
    const [validation, setValidation] = useState<Validation | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const [error, setError] =useState<string | null>(null);

    const [updating, setUpdating] =useState(false);

    const navigate = useNavigate();
    const confirm = useConfirm();
    const [deleting, setDeleting] = useState(false);

    const parsedGoalId =goalId ? Number(goalId) : null;

    const parsedDailyRecordId =dailyRecordId? Number(dailyRecordId): null;

    const invalidGoalId =parsedGoalId === null ||!Number.isSafeInteger(parsedGoalId) ||parsedGoalId <= 0;

    const invalidDailyRecordId =parsedDailyRecordId === null ||!Number.isSafeInteger(parsedDailyRecordId) ||parsedDailyRecordId <= 0;

    const { showToast } = useToast();

    async function handleUpdateDailyRecord(updatedData: DailyRecordRequest): Promise<boolean> {

        if (parsedGoalId === null ||parsedDailyRecordId === null ||!dailyRecord) {
            return false;
        }

        try {
            setUpdating(true);

            const updatedRecord =await updateDailyRecord(parsedGoalId,parsedDailyRecordId, updatedData);
            setDailyRecord(updatedRecord);
            showToast(
                "Daily record updated successfully.",
                "success"
            );
            return true;

        } catch {

            showToast(
                "Could not update daily record.",
                "error"
            );

            return false;

        } finally {
            setUpdating(false);
        }
    }

    async function handleSubmitReview(request: ValidationRequest): Promise<boolean> {
        if (parsedGoalId === null || parsedDailyRecordId === null || reviewSaving) return false;
        setReviewSaving(true);
        setValidationError(null);
        try {
            const result = validation
                ? await updateValidation(parsedGoalId, parsedDailyRecordId, request)
                : await createValidation(parsedGoalId, parsedDailyRecordId, request);
            setValidation(result);
            showToast(validation ? 'Validation updated.' : 'Validation created.', 'success');
            return true;
        } catch (cause) {
            const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
            setValidationError(status === 403 || status === 409
                ? 'You cannot submit this review. The record may already have been validated.'
                : 'Could not save validation. Please try again.');
            return false;
        } finally {
            setReviewSaving(false);
        }
    }

    async function handleDeleteDailyRecord() {

        if (parsedGoalId === null ||parsedDailyRecordId === null ||!dailyRecord) {
            return;
        }

        const confirmed =
            await confirm({
                title: "Delete daily record?",
                message:
                    `Are you sure you want to delete the record from ${dailyRecord.date}? This action cannot be undone.`,
                confirmLabel: "Delete",
                cancelLabel: "Cancel",
                variant: "danger"
            });

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);

            await deleteDailyRecord(parsedGoalId,parsedDailyRecordId );

            showToast(
                "Daily record deleted successfully.",
                "success"
            );

            navigate( dailyRecordsPath(parsedGoalId));

        } catch {

            showToast(
                "Could not delete daily record.",
                "error"
            );

        } finally {
            setDeleting(false);
        }
    }
    useEffect(() => {

        if (invalidGoalId ||invalidDailyRecordId ||parsedGoalId === null || parsedDailyRecordId === null ) {
            return;
        }

        const controller = new AbortController();


        async function loadDailyRecord(goalNumber: number, recordNumber: number ) {

            try {

                setLoading(true);
                setError(null);
                setValidation(null);
                setValidationError(null);

                const response =await getDailyRecord( goalNumber, recordNumber,controller.signal );

                setDailyRecord(response);
                try {
                    const review = await getValidation(goalNumber, recordNumber);
                    if (!controller.signal.aborted) setValidation(review);
                } catch (cause) {
                    if (controller.signal.aborted) return;
                    const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
                    const state = validationLookupState(status);
                    if (state === 'blocked') setValidationError('You cannot view or change this review.');
                    if (state === 'retry') setValidationError('Could not load validation status. Please try again.');
                }

            } catch {

                if (!controller.signal.aborted) {
                    setError("Could not load daily record.");
                }

            } finally {

                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }


        void loadDailyRecord(parsedGoalId,parsedDailyRecordId);


        return () => {
            controller.abort();
        };

    }, [
        parsedGoalId,
        parsedDailyRecordId,
        invalidGoalId,
        invalidDailyRecordId,
        reviewRevision,
        evidenceRevision
    ]);
    if (invalidGoalId ||invalidDailyRecordId) {
        return ( <ErrorMessage message="Invalid daily record id."/>);
    }


    if (loading) {
        return ( <LoadingState message="Loading daily record..." />);
    }


    if (error && !dailyRecord) {
        return ( <ErrorMessage message={error} />);
    }


    if (!dailyRecord || parsedGoalId === null ) {
        return ( <EmptyState message="Daily record not found."/>);
    }
    return (
    <div className="space-y-8">

        <section
            className="
                rounded-2xl
                border border-slate-800
                bg-slate-900/70
                p-6
                shadow-lg shadow-black/10
            "
        >
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-sky-400">
                        Daily Record
                    </p>

                    <h1
                        className="
                            mt-2
                            text-3xl font-bold
                            tracking-tight
                            text-slate-100
                        "
                    >
                        {dailyRecord.date}
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Record #{dailyRecord.id}
                    </p>
                </div>

                <span
                    className="
                        rounded-full
                        bg-sky-950/60
                        px-3 py-1
                        text-xs font-semibold
                        text-sky-300
                    "
                >
                    Progress entry
                </span>
            </div>


            <div className="mt-6 grid gap-4 lg:grid-cols-2">

                <div
                    className="
                        rounded-xl
                        border border-slate-800
                        bg-slate-950/50
                        p-4
                    "
                >
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                        Note
                    </p>

                    <p className="mt-2 leading-6 text-slate-300">
                        {dailyRecord.note || "No note"}
                    </p>
                </div>


                <div
                    className="
                        rounded-xl
                        border border-slate-800
                        bg-slate-950/50
                        p-4
                    "
                >
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                        Evidence
                    </p>

                    <p className="mt-2 wrap-break-word text-slate-300">
                        {dailyRecord.evidence || "No evidence"}
                    </p>
                </div>

            </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-100">
                    Multimedia evidence
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                    Photo and voice evidence attached to this daily record.
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <RecordPhoto
                    goalId={parsedGoalId}
                    recordId={dailyRecord.id}
                    available={dailyRecord.photoAvailable}
                    readOnly={reviewRequested}
                    onChanged={() =>
                        setEvidenceRevision(value => value + 1)
                    }
                />

                <RecordVoice
                    goalId={parsedGoalId}
                    recordId={dailyRecord.id}
                    available={dailyRecord.voiceAvailable}
                    readOnly={reviewRequested}
                    onChanged={() =>
                        setEvidenceRevision(value => value + 1)
                    }
                />
            </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-slate-100">Peer validation</h2>
            {validation ? (
                <div className="mt-3 space-y-2">
                    <p className={validation.approved ? 'font-semibold text-emerald-400' : 'font-semibold text-red-400'}>
                        {validation.approved ? 'Approved' : 'Rejected'}
                    </p>
                    <p className="whitespace-pre-wrap text-slate-300">{validation.comment || 'No comment provided.'}</p>
                </div>
            ) : (
                <p className="mt-3 text-slate-400">{validationError || 'Awaiting peer review.'}</p>
            )}
        </section>
        {reviewRequested ? (
            validationError ? (
                <button type="button" onClick={() => setReviewRevision(value => value + 1)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
                    Retry loading review
                </button>
            ) : (
                <ValidationForm key={validation?.id ?? 'new'} onSubmit={handleSubmitReview}
                    loading={reviewSaving} initialValues={validation ? {
                        approved: validation.approved,
                        comment: validation.comment ?? ''
                    } : undefined}
                    submitLabel={validation ? 'Update validation' : 'Review and validate'} resetAfterSubmit={false} />
            )
        ) : (
        <>
        <section>
            <DailyRecordForm
                onSubmit={handleUpdateDailyRecord}
                loading={updating}
                initialValues={{
                    date: dailyRecord.date,
                    note: dailyRecord.note ?? "",
                    evidence: dailyRecord.evidence ?? ""
                }}
                submitLabel="Update Daily Record"
                resetAfterSubmit={false}
            />
        </section>


        <section
            className="
                rounded-2xl
                border border-red-950
                bg-red-950/20
                p-6
            "
        >
            <h2 className="text-lg font-semibold text-red-300">
                Danger zone
            </h2>

            <p className="mt-1 text-sm text-slate-400">
                Deleting this daily record cannot be undone.
            </p>

            <button
                type="button"
                onClick={handleDeleteDailyRecord}
                disabled={deleting}
                className="
                    mt-4
                    rounded-lg
                    border border-red-900
                    bg-red-950/50
                    px-4 py-2.5
                    text-sm font-semibold
                    text-red-300
                    hover:bg-red-900/40
                    disabled:opacity-50
                "
            >
                {deleting
                    ? "Deleting..."
                    : "Delete Daily Record"}
            </button>
        </section>
        </>
        )}

    </div>
    )


}

export default DailyRecordDetails;