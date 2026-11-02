import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { getActiveTrackingLinks } from "../services/trackingLinkService";
import { getGoals } from "../services/goalService";
import { getDailyRecords } from "../services/dailyRecordService";
import { createValidation, getValidation, updateValidation } from "../services/validationService";
import type { TrackingLink } from "../types/trackingLink";
import type { Goal } from "../types/goal";
import type { DailyRecord } from "../types/dailyRecord";
import type { Validation, ValidationRequest } from "../types/validation";
import type { PageResponse } from "../types/page";
import ValidationForm from "../components/validations/ValidationForm";
import PaginationControls from "../components/ui/PaginationControls";
import LoadingState from "../components/ui/LoadingState";
import ErrorMessage from "../components/ui/ErrorMessage";
import EmptyState from "../components/ui/EmptyState";
import { fallbackPage } from "../utils/pageBounds";

const PAGE_SIZE = 10;

type Partner = { id: number; username: string };

type SelectedGoal = { id: number; topic: string };

function getPartner(link: TrackingLink, currentUserId: number): Partner {
    return link.requesterId === currentUserId
        ? { id: link.receiverId, username: link.receiverUsername }
        : { id: link.requesterId, username: link.requesterUsername };
}

function SectionHeading({ step, title, description }: {
    step: number;
    title: string;
    description: string;
}) {
    return (
        <div className="mb-5">
            <p className="text-sm font-medium text-sky-400">Step {step} of 4</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-100">{title}</h2>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
    );
}

function RetryButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mt-3 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
            Try again
        </button>
    );
}

function Validations() {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const userId = currentUser?.id;

    const [partnerPage, setPartnerPage] = useState(0);
    const [partners, setPartners] = useState<PageResponse<TrackingLink> | null>(null);
    const [partnersLoading, setPartnersLoading] = useState(true);
    const [partnersError, setPartnersError] = useState<string | null>(null);
    const [partnersRevision, setPartnersRevision] = useState(0);
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

    const [goalPage, setGoalPage] = useState(0);
    const [goals, setGoals] = useState<PageResponse<Goal> | null>(null);
    const [goalsLoading, setGoalsLoading] = useState(false);
    const [goalsError, setGoalsError] = useState<string | null>(null);
    const [goalsRevision, setGoalsRevision] = useState(0);
    const [selectedGoal, setSelectedGoal] = useState<SelectedGoal | null>(null);

    const [recordPage, setRecordPage] = useState(0);
    const [records, setRecords] = useState<PageResponse<DailyRecord> | null>(null);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [recordsError, setRecordsError] = useState<string | null>(null);
    const [recordsRevision, setRecordsRevision] = useState(0);
    const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null);

    const [validation, setValidation] = useState<Validation | null>(null);
    const [validationLoading, setValidationLoading] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [validationSaving, setValidationSaving] = useState(false);
    const [validationRevision, setValidationRevision] = useState(0);

    const partnerId = selectedPartner?.id;
    const goalId = selectedGoal?.id;
    const recordId = selectedRecord?.id;

    useEffect(() => {
        if (!userId) return;
        const controller = new AbortController();

        async function loadPartners() {
            setPartnersLoading(true);
            setPartnersError(null);
            setPartners(null);
            try {
                const response = await getActiveTrackingLinks(partnerPage, PAGE_SIZE, controller.signal);
                if (controller.signal.aborted) return;
                const fallback = fallbackPage(partnerPage, response.totalPages);
                if (fallback !== null) {
                    setPartnerPage(fallback);
                    return;
                }
                setPartners(response);
            } catch {
                if (!controller.signal.aborted) setPartnersError("Could not load tracking partners.");
            } finally {
                if (!controller.signal.aborted) setPartnersLoading(false);
            }
        }

        void loadPartners();
        return () => controller.abort();
    }, [userId, partnerPage, partnersRevision]);

    useEffect(() => {
        if (!partnerId) return;
        const controller = new AbortController();

        async function loadGoals() {
            setGoalsLoading(true);
            setGoalsError(null);
            setGoals(null);
            try {
                const response = await getGoals(partnerId!, goalPage, PAGE_SIZE, controller.signal);
                if (controller.signal.aborted) return;
                const fallback = fallbackPage(goalPage, response.totalPages);
                if (fallback !== null) {
                    setGoalPage(fallback);
                    return;
                }
                setGoals(response);
            } catch {
                if (!controller.signal.aborted) setGoalsError("Could not load this partner's goals.");
            } finally {
                if (!controller.signal.aborted) setGoalsLoading(false);
            }
        }

        void loadGoals();
        return () => controller.abort();
    }, [partnerId, goalPage, goalsRevision]);

    useEffect(() => {
        if (!goalId) return;
        const controller = new AbortController();

        async function loadRecords() {
            setRecordsLoading(true);
            setRecordsError(null);
            setRecords(null);
            try {
                const response = await getDailyRecords(goalId!, recordPage, PAGE_SIZE, controller.signal);
                if (controller.signal.aborted) return;
                const fallback = fallbackPage(recordPage, response.totalPages);
                if (fallback !== null) {
                    setRecordPage(fallback);
                    return;
                }
                setRecords(response);
            } catch {
                if (!controller.signal.aborted) setRecordsError("Could not load daily records.");
            } finally {
                if (!controller.signal.aborted) setRecordsLoading(false);
            }
        }

        void loadRecords();
        return () => controller.abort();
    }, [goalId, recordPage, recordsRevision]);

    useEffect(() => {
        if (!goalId || !recordId) return;
        const controller = new AbortController();

        async function loadValidation() {
            setValidationLoading(true);
            setValidationError(null);
            setValidation(null);
            try {
                const response = await getValidation(goalId!, recordId!, controller.signal);
                if (!controller.signal.aborted) setValidation(response);
            } catch (error) {
                if (controller.signal.aborted) return;
                if (!axios.isAxiosError(error) || error.response?.status !== 404) {
                    setValidationError("Could not load this record's validation.");
                }
            } finally {
                if (!controller.signal.aborted) setValidationLoading(false);
            }
        }

        void loadValidation();
        return () => controller.abort();
    }, [goalId, recordId, validationRevision]);

    function selectPartner(partner: Partner) {
        if (partner.id === partnerId) {
            setGoalsRevision(value => value + 1);
            return;
        }
        setSelectedPartner(partner);
        setGoalPage(0);
        setGoals(null);
        setGoalsError(null);
        setSelectedGoal(null);
        setRecordPage(0);
        setRecords(null);
        setRecordsError(null);
        setSelectedRecord(null);
        setValidation(null);
        setValidationError(null);
    }

    function selectGoal(goal: Goal) {
        if (goal.id === goalId) {
            setRecordsRevision(value => value + 1);
            return;
        }
        setSelectedGoal({ id: goal.id, topic: goal.topic });
        setRecordPage(0);
        setRecords(null);
        setRecordsError(null);
        setSelectedRecord(null);
        setValidation(null);
        setValidationError(null);
    }

    function selectRecord(record: DailyRecord) {
        if (record.id === recordId) {
            setValidationRevision(value => value + 1);
            return;
        }
        setSelectedRecord(record);
        setValidation(null);
        setValidationError(null);
    }

    async function saveValidation(request: ValidationRequest): Promise<boolean> {
        if (!goalId || !recordId || validationSaving) return false;

        setValidationSaving(true);
        setValidationError(null);
        try {
            const result = validation
                ? await updateValidation(goalId, recordId, request)
                : await createValidation(goalId, recordId, request);
            setValidation(result);
            showToast(validation ? "Validation updated successfully." : "Validation created successfully.", "success");
            return true;
        } catch (error) {
            const status = axios.isAxiosError(error) ? error.response?.status : undefined;
            const message = status === 409
                ? "This record has already been validated. Refresh to see its status."
                : status === 403
                  ? "You are not allowed to validate this record."
                  : status === 404
                    ? "The selected record could not be found."
                    : "Could not save validation.";
            showToast(message, "error");
            return false;
        } finally {
            setValidationSaving(false);
        }
    }

    if (!currentUser) return null;

    return (
        <div className="space-y-8">
            <header>
                <p className="text-sm font-medium text-sky-400">Review progress</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Validations</h1>
                <p className="mt-2 max-w-2xl text-slate-400">
                    Review a connected partner's progress and approve or reject a daily record.
                </p>
            </header>

            <nav aria-label="Validation steps" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                    { number: 1, label: "Partner", completed: Boolean(selectedPartner) },
                    { number: 2, label: "Goal", completed: Boolean(selectedGoal) },
                    { number: 3, label: "Daily record", completed: Boolean(selectedRecord) },
                    { number: 4, label: "Validation", completed: Boolean(validation) }
                ].map(step => (
                    <div
                        key={step.number}
                        className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                            step.completed
                                ? "border-sky-500/50 bg-sky-950/30 text-sky-200"
                                : "border-slate-800 bg-slate-900/50 text-slate-400"
                        }`}
                    >
                        {step.number}. {step.label}
                    </div>
                ))}
            </nav>

            <section aria-label="Select tracking partner" className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
                <SectionHeading step={1} title="Tracking partners" description="Choose someone you are connected with." />
                {partnersLoading && <LoadingState message="Loading tracking partners..." />}
                {partnersError && <><ErrorMessage message={partnersError} /><RetryButton onClick={() => setPartnersRevision(value => value + 1)} /></>}
                {partners?.empty && <EmptyState message="You have no tracking partners on this page." />}
                {partners && !partners.empty && (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {partners.content.map(link => {
                            const partner = getPartner(link, currentUser.id);
                            const selected = partner.id === partnerId;
                            return (
                                <article key={link.id} className={`rounded-xl border p-4 ${selected ? "border-sky-500/60 bg-sky-950/20" : "border-slate-800 bg-slate-950/50"}`}>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Tracking partner</p>
                                    <h3 className="mt-1 font-semibold text-slate-100">{partner.username}</h3>
                                    <button
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => selectPartner(partner)}
                                        className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
                                    >
                                        {selected ? "Refresh goals" : "View goals"}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
                {partners && partners.totalPages > 1 && (
                    <PaginationControls page={partnerPage} totalPages={partners.totalPages} first={partners.first} last={partners.last}
                        onPrevious={() => setPartnerPage(value => value - 1)} onNext={() => setPartnerPage(value => value + 1)} />
                )}
            </section>

            {selectedPartner && (
                <section aria-label="Select goal" className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
                    <SectionHeading step={2} title={`${selectedPartner.username}'s goals`} description="Select the goal you want to review." />
                    {goalsLoading && <LoadingState message="Loading goals..." />}
                    {goalsError && <><ErrorMessage message={goalsError} /><RetryButton onClick={() => setGoalsRevision(value => value + 1)} /></>}
                    {goals?.empty && <EmptyState message="This partner has no goals on this page." />}
                    {goals && !goals.empty && (
                        <div className="grid gap-3 md:grid-cols-2">
                            {goals.content.map(goal => (
                                <article key={goal.id} className={`rounded-xl border p-4 ${goal.id === goalId ? "border-sky-500/60 bg-sky-950/20" : "border-slate-800 bg-slate-950/50"}`}>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <h3 className="font-semibold text-slate-100">{goal.topic}</h3>
                                        <span className="text-xs font-medium text-slate-400">{goal.completed ? "Completed" : "Active"}</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-400">{goal.frequency} sessions/week · {goal.duration} min/session</p>
                                    <button type="button" aria-pressed={goal.id === goalId} onClick={() => selectGoal(goal)}
                                        className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700">
                                        {goal.id === goalId ? "Refresh records" : "View daily records"}
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                    {goals && goals.totalPages > 1 && (
                        <PaginationControls page={goalPage} totalPages={goals.totalPages} first={goals.first} last={goals.last}
                            onPrevious={() => setGoalPage(value => value - 1)} onNext={() => setGoalPage(value => value + 1)} />
                    )}
                </section>
            )}

            {selectedGoal && (
                <section aria-label="Select daily record" className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
                    <SectionHeading step={3} title={`${selectedGoal.topic} · Daily records`} description="Read the evidence and notes before choosing a record." />
                    {recordsLoading && <LoadingState message="Loading daily records..." />}
                    {recordsError && <><ErrorMessage message={recordsError} /><RetryButton onClick={() => setRecordsRevision(value => value + 1)} /></>}
                    {records?.empty && <EmptyState message="This goal has no daily records on this page." />}
                    {records && !records.empty && (
                        <div className="grid gap-3 lg:grid-cols-2">
                            {records.content.map(record => (
                                <article key={record.id} className={`rounded-xl border p-4 ${record.id === recordId ? "border-sky-500/60 bg-sky-950/20" : "border-slate-800 bg-slate-950/50"}`}>
                                    <h3 className="font-semibold text-slate-100">{record.date}</h3>
                                    <p className="mt-3 text-xs font-medium text-slate-500">Note</p>
                                    <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm text-slate-300">{record.note || "No note"}</p>
                                    <p className="mt-3 text-xs font-medium text-slate-500">Evidence</p>
                                    <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm text-slate-300">{record.evidence || "No evidence"}</p>
                                    <button type="button" aria-pressed={record.id === recordId} onClick={() => selectRecord(record)}
                                        className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400">
                                        {record.id === recordId ? "Refresh validation" : "Review validation"}
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                    {records && records.totalPages > 1 && (
                        <PaginationControls page={recordPage} totalPages={records.totalPages} first={records.first} last={records.last}
                            onPrevious={() => setRecordPage(value => value - 1)} onNext={() => setRecordPage(value => value + 1)} />
                    )}
                </section>
            )}

            {selectedRecord && (
                <section aria-label="Validate record" className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
                    <SectionHeading step={4} title="Validation" description={`Review for ${selectedPartner?.username} · ${selectedRecord.date}`} />
                    {validationLoading && <LoadingState message="Loading validation..." />}
                    {validationError && <><ErrorMessage message={validationError} /><RetryButton onClick={() => setValidationRevision(value => value + 1)} /></>}
                    {!validationLoading && !validationError && (
                        <>
                            {validation && (
                                <p className="mb-4 rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                                    Current decision: <span className="font-semibold text-slate-100">{validation.approved ? "Approved" : "Rejected"}</span>
                                    {validation.comment && <span className="mt-1 block whitespace-pre-wrap">{validation.comment}</span>}
                                </p>
                            )}
                            <ValidationForm
                                key={`${selectedRecord.id}-${validation?.id ?? "new"}-${validation?.approved ?? "none"}-${validation?.comment ?? ""}`}
                                onSubmit={saveValidation}
                                loading={validationSaving}
                                initialValues={validation ? { approved: validation.approved, comment: validation.comment ?? "" } : undefined}
                                submitLabel={validation ? "Update validation" : "Create validation"}
                                resetAfterSubmit={false}
                            />
                        </>
                    )}
                </section>
            )}
        </div>
    );
}

export default Validations;
