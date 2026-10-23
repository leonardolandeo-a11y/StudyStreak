import {
    useEffect,
    useState
}from "react";

import {
    useParams,
    useNavigate
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

import {
    dailyRecordsPath
} from "../routes/paths";

import LoadingState
    from "../components/ui/LoadingState";

import ErrorMessage
    from "../components/ui/ErrorMessage";

import EmptyState
    from "../components/ui/EmptyState";

function DailyRecordDetails(){
    const {goalId,dailyRecordId} = useParams();

    const [dailyRecord, setDailyRecord] =useState<DailyRecord | null>(null);

    const [loading, setLoading] =useState(true);

    const [error, setError] =useState<string | null>(null);

    const [updating, setUpdating] =useState(false);

    const [success, setSuccess] = useState<string|null>(null);

    const navigate = useNavigate();

    const [deleting, setDeleting] = useState(false);

    const parsedGoalId =goalId ? Number(goalId) : null;

    const parsedDailyRecordId =dailyRecordId? Number(dailyRecordId): null;

    const invalidGoalId =parsedGoalId === null ||!Number.isSafeInteger(parsedGoalId) ||parsedGoalId <= 0;

    const invalidDailyRecordId =parsedDailyRecordId === null ||!Number.isSafeInteger(parsedDailyRecordId) ||parsedDailyRecordId <= 0;
    async function handleUpdateDailyRecord(updatedData: DailyRecordRequest): Promise<boolean>{
        if(parsedGoalId===null || parsedDailyRecordId === null || !dailyRecord){
            return false;
        }
        try{
            setUpdating(true);
            setError(null);
            setSuccess(null);

            const updatedRecord = await updateDailyRecord(parsedGoalId,parsedDailyRecordId,updatedData);
            setDailyRecord(updatedRecord);
            setSuccess("Daily record updated successfully.");
            return true;
        }catch{
            setError("Could not update daily record");
            return false;
        }finally{
            setUpdating(false);
        }
        
    }

    async function handleDeleteDailyRecord(){
        if (parsedGoalId === null || parsedDailyRecordId === null ||!dailyRecord){
            return;
        }
        const confirmed = window.confirm(`Delete daily record from ${dailyRecord.date}`);
        if(!confirmed){
            return;
        }
        try{
            setDeleting(true);
            setError(null);

            await deleteDailyRecord(parsedGoalId,parsedDailyRecordId);
            navigate(dailyRecordsPath(parsedGoalId));
        }catch{
            setError("Could not delete daily record.");
        }finally{
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

                const response =await getDailyRecord( goalNumber, recordNumber,controller.signal );

                setDailyRecord(response);

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
        invalidDailyRecordId
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

                    <p className="mt-2 break-words text-slate-300">
                        {dailyRecord.evidence || "No evidence"}
                    </p>
                </div>

            </div>
        </section>


        {success && (
            <div
                className="
                    rounded-xl
                    border border-emerald-900/60
                    bg-emerald-950/40
                    px-4 py-3
                    text-sm text-emerald-300
                "
            >
                {success}
            </div>
        )}


        {error && (
            <ErrorMessage
                message={error}
            />
        )}


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

    </div>
    )


}

export default DailyRecordDetails;