import {
    useEffect,
    useState
}from "react";

import {
    Link, useParams, useNavigate
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
        <div className="p-6">
            <Link
                to={dailyRecordsPath(parsedGoalId)}
                className="inline-block mb-4 underline"
            >
                Back to Daily Records
            </Link>

            <h1 className="text-3xl font-bold">
                Daily Record
            </h1>

            <div className="mt-4 space-y-2">
                <p>
                    Date: {dailyRecord.date}
                </p>

                <p>
                    Note: {dailyRecord.note ?? "No note"}
                </p>

                <p>
                    Evidence: {dailyRecord.evidence ?? "No evidence"}
                </p>
            </div>

            {success && (
                <p className="mt-4 text-green-500">
                    {success}
                </p>
            )}

            {error && (
                <ErrorMessage
                    message={error}
                />
            )}

            <div className="mt-6">
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
            </div>
            <button
                type="button"
                onClick={handleDeleteDailyRecord}
                disabled={deleting}
                className="mt-6 border p-2 text-red-500"
            >
                {deleting
                    ? "Deleting..."
                    : "Delete Daily Record"}
            </button>
        </div>
    )


}

export default DailyRecordDetails;