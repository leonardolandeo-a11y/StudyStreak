import apiClient from "./apiClient";

function photoPath(
    goalId:number,
    recordId:number
):string {
    return `/api/goals/${goalId}/daily-records/${recordId}/photo`;
}

export async function downloadRecordPhoto(
    goalId:number,
    recordId:number,
    signal?:AbortSignal
):Promise<Blob> {
    const response = await apiClient.get<Blob>(
        photoPath(goalId, recordId),
        {
            responseType:"blob",
            timeout:30000,
            signal
        }
    );

    return response.data;
}

export async function uploadRecordPhoto(
    goalId:number,
    recordId:number,
    file:File
):Promise<void> {
    const form = new FormData();
    form.append("photo", file);

    await apiClient.post(
        photoPath(goalId, recordId),
        form,
        {
            timeout:30000
        }
    );
}

export async function deleteRecordPhoto(
    goalId:number,
    recordId:number
):Promise<void> {
    await apiClient.delete(
        photoPath(goalId, recordId)
    );
}
