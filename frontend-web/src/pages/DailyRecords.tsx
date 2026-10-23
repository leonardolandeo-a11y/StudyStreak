import {
    useEffect,
    useState
} from "react";

import {
    useParams,
    useSearchParams
} from "react-router-dom";

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

import LoadingState from "../components/ui/LoadingState";

import ErrorMessage from "../components/ui/ErrorMessage";

import EmptyState from "../components/ui/EmptyState";

import PaginationControls from "../components/ui/PaginationControls";

import { useToast } from "../hooks/useToast";
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


    const page = Number.isInteger(pageParam) && pageParam>= 0 ?pageParam:0;

    const { showToast } = useToast();

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

    async function handleCreateDailyRecord( dailyRecord: DailyRecordRequest ): Promise<boolean> {

        if (parsedGoalId === null) {
            return false;
        }

        try {
            setCreating(true);

            await createDailyRecord( parsedGoalId,dailyRecord);
            if (page === 0) {

                const updatedRecords =await getDailyRecords(parsedGoalId, 0,10);
                setRecordPage(updatedRecords);

            } else {

                setSearchParams({
                    page: "0"
                });
            }


            showToast("Daily record created successfully.","success");
            return true;

        } catch (caughtError) {

            if (axios.isAxiosError<ApiErrorResponse>(caughtError) &&caughtError.response?.status === 409 ) {
                showToast( caughtError.response.data?.message ??"A daily record already exists for this date.", "error");
            } else {

                showToast(
                    "Could not create daily record.",
                    "error"
                );
            }

            return false;

        } finally {
            setCreating(false);
        }
    }
    useEffect(() => {

        if (invalidGoalId ||parsedGoalId === null) {
            return;
        }

        const controller =new AbortController();


        async function loadDailyRecords(id: number) {

            try {

                setLoading(true);
                setError(null);

                const response =await getDailyRecords(id,page,10,controller.signal);

                setRecordPage(response);

            } catch {

                if (!controller.signal.aborted) {
                    setError("Could not load daily records.");
                }

            } finally {

                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }


        void loadDailyRecords(
            parsedGoalId
        );


        return () => {
            controller.abort();
        };

    }, [
        parsedGoalId,
        invalidGoalId,
        page
    ]);

    if (invalidGoalId){
        return (
            <ErrorMessage
                message="Invalid goal id."
            />
        );
    }
    if (loading){
        return (
            <LoadingState
                message="Loading daily records..."
            />
        );
    }
    if (error && !recordPage){
        return (
            <ErrorMessage
                message={error}
            />
        );
    }
    if (!recordPage || parsedGoalId === null){
        return null;
    }
    return(
    <div className="space-y-8">

        <section>
            <p className="text-sm font-medium text-sky-400">
                Progress tracking
            </p>

            <h1
                className="
                    mt-2
                    text-3xl font-bold
                    tracking-tight
                    text-slate-100
                "
            >
                Daily Records
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
                Log your progress for this goal and review
                previous study records.
            </p>
        </section>


        <section>
            <DailyRecordForm
                onSubmit={handleCreateDailyRecord}
                loading={creating}
            />
        </section>

        {error && recordPage && (
            <ErrorMessage
                message={error}
            />
        )}


        <section>
            <div
                className="
                    mb-5
                    flex flex-wrap
                    items-end
                    justify-between
                    gap-3
                "
            >
                <div>
                    <h2 className="text-xl font-semibold text-slate-100">
                        Record history
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Your logged progress for this goal.
                    </p>
                </div>

                {!recordPage.empty && (
                    <span
                        className="
                            rounded-full
                            border border-slate-800
                            bg-slate-900
                            px-3 py-1
                            text-xs font-medium
                            text-slate-400
                        "
                    >
                        {recordPage.totalElements} total
                    </span>
                )}
            </div>


            {recordPage.empty && (
                <EmptyState
                    message="No daily records yet. Add your first record above."
                />
            )}


            {!recordPage.empty && (
                <div
                    className="
                        grid gap-4
                        lg:grid-cols-2
                    "
                >
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
            )}


            {!recordPage.empty && (
                <PaginationControls
                    page={page}
                    totalPages={recordPage.totalPages}
                    first={recordPage.first}
                    last={recordPage.last}
                    onPrevious={goToPreviousPage}
                    onNext={goToNextPage}
                />
            )}
        </section>

    </div>
)
}
export default DailyRecords;