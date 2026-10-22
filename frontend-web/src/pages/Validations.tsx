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


function Validations(){

    const {currentUser}= useAuth();

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

    const [validationSuccess, setValidationSuccess] = useState<string|null>(null);

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


    async function handleSubmitValidation(request:ValidationRequest):Promise<boolean>{

        if (!selectedGoalId || !selectedDailyRecordId){
            return false;
        }
        try{
            setValidationSaving(true);
            setValidationError(null);
            setValidationSuccess(null);

            if (validation){
                const updatedValidation = await updateValidation(selectedGoalId,selectedDailyRecordId,request);
                setValidation(updatedValidation);
                setValidationSuccess("Validation updated successfully");

            }else{
                const createdValidation = await createValidation(selectedGoalId,selectedDailyRecordId,request);
                setValidation(createdValidation);
                setValidationSuccess("Validation created successfully");
            }
            return true;
        }catch (caughtError){
            if ( axios.isAxiosError(caughtError)){
                const status = caughtError.response?.status;
                if (status === 409){
                    setValidationError(caughtError.response?.data?.message ?? "This record has already been validated.");
                }else if (status ===403){
                    setValidationError("You are not allowed to validate this record.");
                }else if (status === 404){
                    setValidationError("The selected record could not be found.");
                }else{
                    setValidationError("Could not save validation.")
                }
            }else{
                setValidationError("Could not save validation.");
            }
            return false;
        }finally{
            setValidationSaving(false); 
        }
    }
    useEffect(() =>{
            let cancelled = false;
            async function loadTrackingPartners(){
                try{
                    setLoading(true);
                    setError(null);

                    const activeLinks = await getActiveTrackingLinks(0,20);

                    if (!cancelled){
                        setActivePage(activeLinks);
                    }
                }catch{
                    if (!cancelled){
                        setError("Could not load tracking partners.");
                    }
                }finally{
                    if (!cancelled){
                        setLoading(false);
                    }
                }
            }
            void loadTrackingPartners();

            return ()=> {
                cancelled = true;
            };
    },[]);
    if (!currentUser){
        return null;
    }
    if (loading){
        return (<p>Loading tracking partners...</p>);
    }
    if (error){
        return (<p className="text-red-500">{error}</p>);
    }
    if (!activePage){
        return null;
    }

    return(
        <div className="p-6">

            <h1 className="text-3xl font-bold">
                Validations
            </h1>

            <p className="mt-2">
                Select a tracking partner whose progress
                you want to validate.
            </p>


            {activePage.empty && (
                <p className="mt-6">
                    You do not have any accepted
                    tracking partners yet.
                </p>
            )}


            <div className="mt-6 space-y-4">

                {activePage.content.map(
                    (trackingLink) => {

                        const partnerId = trackingLink.requesterId === currentUser.id ? trackingLink.receiverId :trackingLink.requesterId;

                        return (
                            <div
                                key={trackingLink.id}
                                className="border p-4"
                            >
                                <p className="font-semibold">
                                    User {partnerId}
                                </p>

                                <p>
                                    Status: {trackingLink.status}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => handleViewGoals(partnerId)}
                                    className="mt-3 border p-2"
                                >
                                    View Goals
                                </button>
                            </div>
                        );
                    }
                )}

            </div>

            {selectedPartnerId && (
            <div className="mt-8">

                <h2 className="text-2xl font-bold">
                    User {selectedPartnerId}'s Goals
                </h2>

                {goalsLoading && (
                    <p className="mt-4">
                        Loading goals...
                    </p>
                )}

                {goalsError && (
                    <p className="mt-4 text-red-500">
                        {goalsError}
                    </p>
                )}

                {goalsPage && goalsPage.empty && (
                    <p className="mt-4">
                        This user does not have any goals.
                    </p>
                )}

                {goalsPage && (
                    <div className="mt-4 space-y-4">

                        {goalsPage.content.map(
                            (goal) => (
                                <div
                                    key={goal.id}
                                    className="border p-4"
                                >
                                    <p className="font-semibold">
                                        {goal.topic}
                                    </p>

                                    <p>
                                        Frequency: {goal.frequency}
                                    </p>

                                    <p>
                                        Duration: {goal.duration}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>handleViewDailyRecords(goal.id)}
                                        className="mt-3 border p-2"
                                    >
                                        View Daily Records
                                    </button>
                                </div>
                            )
                        )}

                    </div>
                )}

            </div>
            )}
            {selectedGoalId && (
                <div className="mt-8">

                    <h2 className="text-2xl font-bold">
                        Daily Records for Goal {selectedGoalId}
                    </h2>

                    {dailyRecordsLoading && (
                        <p className="mt-4">
                            Loading daily records...
                        </p>
                    )}

                    {dailyRecordsError && (
                        <p className="mt-4 text-red-500">
                            {dailyRecordsError}
                        </p>
                    )}

                    {dailyRecordsPage && dailyRecordsPage.empty && (
                        <p className="mt-4">
                            This goal does not have any daily records.
                        </p>
                    )}

                    {dailyRecordsPage && (
                        <div className="mt-4 space-y-4">

                            {dailyRecordsPage.content.map(
                                (dailyRecord) => (
                                    <div
                                        key={dailyRecord.id}
                                        className="border p-4"
                                    >
                                        <p className="font-semibold">
                                            Date: {dailyRecord.date}
                                        </p>

                                        <p>
                                            Note: {dailyRecord.note || "No note"}
                                        </p>

                                        <p>
                                            Evidence: {dailyRecord.evidence || "No evidence"}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleValidateRecord(dailyRecord.id)
                                            }
                                            className="mt-3 border p-2"
                                        >
                                            Validate Record
                                        </button>
                                    </div>
                                )
                            )}

                        </div>
                    )}

                </div>
            )}


            {selectedDailyRecordId && (
                <div className="mt-8">

                    <h2 className="text-2xl font-bold">
                        Validation for Daily Record {selectedDailyRecordId}
                    </h2>

                    {validationLoading && (
                        <p className="mt-4">
                            Loading validation...
                        </p>
                    )}

                    {validationError && (
                        <p className="mt-4 text-red-500">
                            {validationError}
                        </p>
                    )}

                    {validationSuccess && (
                        <p className="mt-4 text-green-500">
                            {validationSuccess}
                        </p>
                    )}

                    {!validationLoading && !validationError && (
                        <div className="mt-4">

                            <ValidationForm
                                key={selectedDailyRecordId}
                                onSubmit={handleSubmitValidation}
                                loading={validationSaving}
                                initialValues={
                                    validation? {
                                            approved: validation.approved,
                                            comment: validation.comment ?? ""
                                        }: undefined
                                }
                                submitLabel={validation? "Update Validation": "Create Validation"
                                }
                                resetAfterSubmit={false}
                            />

                        </div>
                    )}

                </div>
            )}


        </div>
    );
}

export default Validations;