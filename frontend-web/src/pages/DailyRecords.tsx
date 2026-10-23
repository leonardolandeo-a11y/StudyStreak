import {
    useEffect,
    useState
} from "react";

import { Link,useParams,useSearchParams } from "react-router-dom";

import { getDailyRecords,
    createDailyRecord
} from "../services/dailyRecordService";

import axios from "axios";

import DailyRecordCard from "../components/dailyRecords/DailyRecordCard";

import type { DailyRecord,
    DailyRecordRequest
} from "../types/dailyRecord";

import type { PageResponse } from "../types/page";

import DailyRecordForm from "../components/dailyRecords/DailyRecordForm";
import {
    goalDetailsPath
} from "../routes/paths";
interface ApiErrorResponse {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    path: string;
}


function DailyRecords(){
    const {goalId} = useParams();

    const [searchParams, setSearchParams]= useSearchParams();

    const [recordPage, setRecordPage] = useState<PageResponse<DailyRecord>|null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string|null> (null);

    const parsedGoalId = goalId ? Number(goalId) : null;
    
    const invalidGoalId = parsedGoalId ===null || !Number.isSafeInteger(parsedGoalId)|| parsedGoalId<= 0;
    
    const pageParam = Number(searchParams.get("page") ?? "0");

    const [creating, setCreating] = useState(false);

    const [success, setSuccess] = useState<string|null>(null);

    const page = Number.isInteger(pageParam) && pageParam>= 0 ?pageParam:0;

    function goToPreviousPage(){
        if (page<= 0){
            return;
        }
        setSearchParams({
            page:String(page-1),
        })
    }
    function goToNextPage(){
        if(!recordPage || recordPage.last){
            return;
        }
        setSearchParams({
            page:String(page+1)
        });
    }

    async function handleCreateDailyRecord(dailyRecord:DailyRecordRequest): Promise<boolean>{
        if (parsedGoalId === null){
            return false;
        }
        try{
            setCreating(true);
            setError(null);
            setSuccess(null);

            await createDailyRecord(parsedGoalId,dailyRecord);

            if (page === 0){
                const updatedRecords = await getDailyRecords(parsedGoalId,0,10);
                setRecordPage(updatedRecords);
            }else{
                setSearchParams({
                    page:"0"
                });
            }
            setSuccess("Daily record created successfully.");
            return true;

        }

        catch (caughtError) {
            if (
                axios.isAxiosError<ApiErrorResponse>(caughtError) &&
                caughtError.response?.status === 409
            ) {
                setError(
                    caughtError.response.data?.message ??
                    "A daily record already exists for this date."
                );
            } else {
                setError(
                    "Could not create daily record."
                );
            }

            return false;
        } finally {
            setCreating(false);
        }
    }
    useEffect(()=>{
        if (invalidGoalId|| parsedGoalId===null){
            return;
        }
        let cancelled = false;

        async function loadDailyRecords(id:number){
            try{
                setLoading(true);
                setError(null);

                const response = await getDailyRecords(id,page,10);

                if (!cancelled){
                    setRecordPage(response);
                }

            }catch{
                if (!cancelled){
                    setError("Could not load daily records.");
                }
            }finally{
                if(!cancelled){
                    setLoading(false);
                }
            }

        }

        void loadDailyRecords(parsedGoalId);
        
        return () =>{
            cancelled = true;
        };
    },[parsedGoalId,invalidGoalId,page]);

    if (invalidGoalId){
        return <p>Invalid goal id.</p>;
    }
    if (loading){
        return <p>Loading daily records...</p>;
    }
    if (error && !recordPage){
        return (
            <p className="text-red-500">{error}</p>
        );
    }
    if (!recordPage || parsedGoalId === null){
        return null;
    }
    return(
    <div className="p-6">
        <Link
            to={goalDetailsPath(parsedGoalId)}
            className="inline-block mb-4 underline"
        >
            Back to Goal
        </Link>

        <h1 className="text-3xl font-bold">
            Daily Records
        </h1>

        <div className="mt-6">
            <DailyRecordForm
                onSubmit={handleCreateDailyRecord}
                loading={creating}
            />
        </div>

        {success && (
            <p className="mt-4 text-green-500">
                {success}
            </p>
        )}
        {error && (
            <p className="mt-4 text-red-500">
                {error}
            </p>
        )}
        {recordPage.empty && (
            <p className="mt-4">
                No daily records yet.
            </p>
        )}

        <div className="mt-6 space-y-4">
            {recordPage.content.map(
            (dailyRecord) => (
                <DailyRecordCard
                key={dailyRecord.id}
                dailyRecord={dailyRecord}
                goalId={parsedGoalId}
                />
            )
            )}
        </div>

        <div className="mt-6 flex items-center gap-4">
            <button
                type="button"
                onClick={goToPreviousPage}
                disabled={page === 0}
                className="border p-2 disabled:opacity-50"
            >
                Previous
            </button>

            <span>
            Page {page + 1}
            {recordPage.totalPages > 0 &&
                ` of ${recordPage.totalPages}`}
            </span>

            <button
                type="button"
                onClick={goToNextPage}
                disabled={recordPage.last}
                className="border p-2 disabled:opacity-50"
            >
                Next
            </button>
        </div>
    </div>
)
}
export default DailyRecords;