import {
    useEffect,
    useState
} from "react";

import {
    getActiveTrackingLinks
} from "../services/trackingLinkService";
import{
    useAuth
} from "../hooks/useAuth";
import type{
    TrackingLink
} from "../types/trackingLink";

import type{
    PageResponse
} from "../types/page";

import {
    getGoals
} from "../services/goalService";

import type{
    Goal
} from "../types/goal";

import {
    getDailyRecords
} from "../services/dailyRecordService";

import type {
    DailyRecord
} from "../types/dailyRecord";

import axios from "axios";

import {
    getValidation,
    createValidation,
    updateValidation
} from "../services/validationService";

import type {
    Validation
} from "../types/validation";

import ValidationForm from "../components/validations/ValidationForm";

import type{
    ValidationRequest
} from "../types/validation";

import LoadingState
    from "../components/ui/LoadingState";

import ErrorMessage
    from "../components/ui/ErrorMessage";

import EmptyState
    from "../components/ui/EmptyState";

import { useToast } from "../hooks/useToast";
function Validations(){

    const {currentUser}= useAuth();

    const { showToast } = useToast();

    const [activePage, setActivePage] = useState<PageResponse<TrackingLink> |null> (null);

    const[loading, setLoading] = useState(true);

    const [error, setError] = useState<string|null>(null);

    const [selectedPartnerId,setSelectedPartnerId] = useState<number|null>(null);

    const [goalsPage, setGoalsPage] = useState<PageResponse<Goal>|null> (null);
    
    const [goalsLoading, setGoalsLoading] = useState(false);

    const [goalsError, setGoalsError] = useState<string|null>(null);

    const [selectedGoalId, setSelectedGoalId] =useState<number | null>(null);

    const [dailyRecordsPage, setDailyRecordsPage] =useState<PageResponse<DailyRecord> | null>(null);

    const [dailyRecordsLoading, setDailyRecordsLoading] =useState(false);

    const [dailyRecordsError, setDailyRecordsError] =useState<string | null>(null);

    const [selectedDailyRecordId, setSelectedDailyRecordId] = useState<number | null>(null);

    const [validation, setValidation] = useState<Validation | null>(null);

    const [validationLoading, setValidationLoading] =useState(false);

    const [validationError, setValidationError] =useState<string | null>(null);

    const [validationSaving, setValidationSaving] = useState(false);


    async function handleViewGoals(partnerId:number){
        try{
            setGoalsLoading(true);
            setGoalsError(null);
            setSelectedPartnerId(partnerId);
            setGoalsPage(null);

            setSelectedGoalId(null);
            setDailyRecordsPage(null);
            setDailyRecordsError(null);

            const partnerGoals = await getGoals(partnerId,0,20);
            
            setGoalsPage(partnerGoals);
        }catch{
            setGoalsError("Could not load this user's goals.");
            setGoalsPage(null);
        }finally{
            setGoalsLoading(false);
        }
    }
    async function handleViewDailyRecords(goalId: number) {

        try {
            setDailyRecordsLoading(true);
            setDailyRecordsError(null);

            setSelectedGoalId(goalId);
            setDailyRecordsPage(null);
            setSelectedDailyRecordId(null);
            setValidation(null);
            setValidationError(null);

            const records =await getDailyRecords(goalId, 0, 20);

            setDailyRecordsPage(records);

        } catch {

            setDailyRecordsError("Could not load daily records.");

            setDailyRecordsPage(null);

        } finally {
            setDailyRecordsLoading(false);
        }
    }
    async function handleValidateRecord(dailyRecordId: number) {

        if (!selectedGoalId) {
            return;
        }

        try {
            setSelectedDailyRecordId(dailyRecordId);

            setValidationLoading(true);
            setValidationError(null);
            setValidation(null);

            const existingValidation =await getValidation(selectedGoalId,dailyRecordId);

            setValidation(existingValidation);

        } catch (caughtError) {

            if (axios.isAxiosError(caughtError) &&caughtError.response?.status === 404) {
                setValidation(null);
            } else {
                setValidationError("Could not load validation.");
            }

        } finally {
            setValidationLoading(false);
        }
    }

    async function handleSubmitValidation(
        request: ValidationRequest
    ): Promise<boolean> {

        if (
            !selectedGoalId ||
            !selectedDailyRecordId
        ) {
            return false;
        }

        try {
            setValidationSaving(true);
            setValidationError(null);

            if (validation) {

                const updatedValidation =
                    await updateValidation(
                        selectedGoalId,
                        selectedDailyRecordId,
                        request
                    );

                setValidation(
                    updatedValidation
                );

                showToast(
                    "Validation updated successfully.",
                    "success"
                );

            } else {

                const createdValidation =
                    await createValidation(
                        selectedGoalId,
                        selectedDailyRecordId,
                        request
                    );

                setValidation(
                    createdValidation
                );

                showToast(
                    "Validation created successfully.",
                    "success"
                );
            }

            return true;

        } catch (caughtError) {

            if (
                axios.isAxiosError(
                    caughtError
                )
            ) {
                const status =
                    caughtError.response?.status;


                if (status === 409) {

                    showToast(
                        caughtError.response?.data?.message ??
                            "This record has already been validated.",
                        "error"
                    );

                } else if (status === 403) {

                    showToast(
                        "You are not allowed to validate this record.",
                        "error"
                    );

                } else if (status === 404) {

                    showToast(
                        "The selected record could not be found.",
                        "error"
                    );

                } else {

                    showToast(
                        "Could not save validation.",
                        "error"
                    );
                }

            } else {

                showToast(
                    "Could not save validation.",
                    "error"
                );
            }

            return false;

        } finally {
            setValidationSaving(false);
        }
    }
    useEffect(() => {

        const controller = new AbortController();


        async function loadTrackingPartners() {

            try {

                setLoading(true);
                setError(null);

                const activeLinks = await getActiveTrackingLinks(0,20,controller.signal);
                setActivePage(activeLinks);

            } catch {

                if (!controller.signal.aborted) {
                    setError("Could not load tracking partners.");
                }

            } finally {

                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }


        void loadTrackingPartners();


        return () => {
            controller.abort();
        };

    }, []);
    if (!currentUser){
        return null;
    }
    if (loading) {
        return (
            <LoadingState
                message="Loading tracking partners..."
            />
        );
    }

    if (error) {
        return (
            <ErrorMessage
                message={error}
            />
        );
    }
    if (!activePage){
        return null;
    }

    return(
    <div className="space-y-10">

        <section>
            <p className="text-sm font-medium text-sky-400">
                Review progress
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">
                Validations
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
                Select a tracking partner, choose one of their goals,
                and validate their daily progress.
            </p>
        </section>


        <section>
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-100">
                    Tracking Partners
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                    Choose a connected user whose progress you want to review.
                </p>
            </div>


            {activePage.empty && (
                <EmptyState
                    message="You do not have any accepted tracking partners yet."
                />
            )}


            {!activePage.empty && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activePage.content.map(
                        (trackingLink) => {

                            const partnerId =
                                trackingLink.requesterId === currentUser.id
                                    ? trackingLink.receiverId
                                    : trackingLink.requesterId;

                            const selected =
                                selectedPartnerId === partnerId;

                            return (
                                <article
                                    key={trackingLink.id}
                                    className={`
                                        rounded-2xl
                                        border
                                        p-5
                                        transition
                                        ${
                                            selected
                                                ? "border-sky-500/60 bg-sky-950/20"
                                                : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                                        }
                                    `}
                                >
                                    <div
                                        className="
                                            flex flex-wrap
                                            items-start
                                            justify-between
                                            gap-3
                                        "
                                    >
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                Tracking partner
                                            </p>

                                            <p className="mt-1 text-lg font-semibold text-slate-100">
                                                User {partnerId}
                                            </p>
                                        </div>

                                        <span
                                            className="
                                                rounded-full
                                                bg-emerald-950/60
                                                px-3 py-1
                                                text-xs font-semibold
                                                text-emerald-300
                                            "
                                        >
                                            {trackingLink.status}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleViewGoals(partnerId)
                                        }
                                        className="
                                            mt-5
                                            rounded-lg
                                            bg-slate-800
                                            px-4 py-2
                                            text-sm font-medium
                                            text-slate-200
                                            hover:bg-slate-700
                                        "
                                    >
                                        {selected
                                            ? "Refresh Goals"
                                            : "View Goals"}
                                    </button>
                                </article>
                            );
                        }
                    )}
                </div>
            )}
        </section>


        {selectedPartnerId && (
            <section
                className="
                    rounded-2xl
                    border border-slate-800
                    bg-slate-900/40
                    p-6
                "
            >
                <div className="mb-5">
                    <p className="text-sm font-medium text-sky-400">
                        Step 2
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold text-slate-100">
                        User {selectedPartnerId}&apos;s Goals
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Select a goal to review its daily records.
                    </p>
                </div>


                {goalsLoading && (
                    <LoadingState
                        message="Loading goals..."
                    />
                )}


                {goalsError && (
                    <ErrorMessage
                        message={goalsError}
                    />
                )}


                {goalsPage && goalsPage.empty && (
                    <EmptyState
                        message="This user does not have any goals."
                    />
                )}


                {goalsPage && !goalsPage.empty && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {goalsPage.content.map(
                            (goal) => {

                                const selected =
                                    selectedGoalId === goal.id;

                                return (
                                    <article
                                        key={goal.id}
                                        className={`
                                            rounded-xl
                                            border
                                            p-5
                                            ${
                                                selected
                                                    ? "border-sky-500/60 bg-sky-950/20"
                                                    : "border-slate-800 bg-slate-950/50"
                                            }
                                        `}
                                    >
                                        <div
                                            className="
                                                flex flex-wrap
                                                items-start
                                                justify-between
                                                gap-3
                                            "
                                        >
                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-slate-500">
                                                    Goal
                                                </p>

                                                <p className="mt-1 text-lg font-semibold text-slate-100">
                                                    {goal.topic}
                                                </p>
                                            </div>

                                            <span
                                                className={`
                                                    rounded-full
                                                    px-3 py-1
                                                    text-xs font-semibold
                                                    ${
                                                        goal.completed
                                                            ? "bg-emerald-950/60 text-emerald-300"
                                                            : "bg-sky-950/60 text-sky-300"
                                                    }
                                                `}
                                            >
                                                {goal.completed
                                                    ? "Completed"
                                                    : "Active"}
                                            </span>
                                        </div>


                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div
                                                className="
                                                    rounded-lg
                                                    border border-slate-800
                                                    bg-slate-900/60
                                                    p-3
                                                "
                                            >
                                                <p className="text-xs text-slate-500">
                                                    Frequency
                                                </p>

                                                <p className="mt-1 font-medium text-slate-200">
                                                    {goal.frequency}
                                                </p>
                                            </div>

                                            <div
                                                className="
                                                    rounded-lg
                                                    border border-slate-800
                                                    bg-slate-900/60
                                                    p-3
                                                "
                                            >
                                                <p className="text-xs text-slate-500">
                                                    Duration
                                                </p>

                                                <p className="mt-1 font-medium text-slate-200">
                                                    {goal.duration}
                                                </p>
                                            </div>
                                        </div>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleViewDailyRecords(
                                                    goal.id
                                                )
                                            }
                                            className="
                                                mt-4
                                                rounded-lg
                                                bg-slate-800
                                                px-4 py-2
                                                text-sm font-medium
                                                text-slate-200
                                                hover:bg-slate-700
                                            "
                                        >
                                            View Daily Records
                                        </button>
                                    </article>
                                );
                            }
                        )}
                    </div>
                )}
            </section>
        )}


        {selectedGoalId && (
            <section
                className="
                    rounded-2xl
                    border border-slate-800
                    bg-slate-900/40
                    p-6
                "
            >
                <div className="mb-5">
                    <p className="text-sm font-medium text-sky-400">
                        Step 3
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold text-slate-100">
                        Daily Records
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Review a progress entry before validating it.
                    </p>
                </div>


                {dailyRecordsLoading && (
                    <LoadingState
                        message="Loading daily records..."
                    />
                )}


                {dailyRecordsError && (
                    <ErrorMessage
                        message={dailyRecordsError}
                    />
                )}


                {dailyRecordsPage &&
                    dailyRecordsPage.empty && (
                        <EmptyState
                            message="This goal does not have any daily records."
                        />
                    )}


                {dailyRecordsPage &&
                    !dailyRecordsPage.empty && (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {dailyRecordsPage.content.map(
                                (dailyRecord) => {

                                    const selected =
                                        selectedDailyRecordId ===
                                        dailyRecord.id;

                                    return (
                                        <article
                                            key={dailyRecord.id}
                                            className={`
                                                rounded-xl
                                                border
                                                p-5
                                                ${
                                                    selected
                                                        ? "border-sky-500/60 bg-sky-950/20"
                                                        : "border-slate-800 bg-slate-950/50"
                                                }
                                            `}
                                        >
                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                {dailyRecord.date}
                                            </p>

                                            <div className="mt-4 space-y-4">

                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Note
                                                    </p>

                                                    <p className="mt-1 text-sm leading-6 text-slate-300">
                                                        {dailyRecord.note ||
                                                            "No note"}
                                                    </p>
                                                </div>


                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Evidence
                                                    </p>

                                                    <p className="mt-1 wrap-break-word text-sm text-slate-300">
                                                        {dailyRecord.evidence ||
                                                            "No evidence"}
                                                    </p>
                                                </div>

                                            </div>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleValidateRecord(
                                                        dailyRecord.id
                                                    )
                                                }
                                                className="
                                                    mt-5
                                                    rounded-lg
                                                    bg-sky-500
                                                    px-4 py-2
                                                    text-sm font-semibold
                                                    text-slate-950
                                                    hover:bg-sky-400
                                                "
                                            >
                                                Validate Record
                                            </button>
                                        </article>
                                    );
                                }
                            )}
                        </div>
                    )}
            </section>
        )}


        {selectedDailyRecordId && (
            <section>
                <div className="mb-5">
                    <p className="text-sm font-medium text-sky-400">
                        Step 4
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold text-slate-100">
                        Validation
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Daily Record #{selectedDailyRecordId}
                    </p>
                </div>


                {validationLoading && (
                    <LoadingState
                        message="Loading validation..."
                    />
                )}


                {validationError && (
                    <ErrorMessage
                        message={validationError}
                    />
                )}
                {!validationLoading &&
                    !validationError && (
                        <div className="mt-4">
                            <ValidationForm
                                key={selectedDailyRecordId}
                                onSubmit={
                                    handleSubmitValidation
                                }
                                loading={
                                    validationSaving
                                }
                                initialValues={
                                    validation
                                        ? {
                                              approved:
                                                  validation.approved,
                                              comment:
                                                  validation.comment ??
                                                  ""
                                          }
                                        : undefined
                                }
                                submitLabel={
                                    validation
                                        ? "Update Validation"
                                        : "Create Validation"
                                }
                                resetAfterSubmit={false}
                            />
                        </div>
                    )}
            </section>
        )}

    </div>
    );
}

export default Validations;