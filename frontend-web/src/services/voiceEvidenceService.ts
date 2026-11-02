import apiClient from "./apiClient";

function voicePath(
    goalId:number,
    recordId:number
):string {
    return `/api/goals/${goalId}/daily-records/${recordId}/voice`;
}

function normalizeM4aFile(file:File):File {
    const acceptedTypes = new Set([
        "audio/mp4",
        "audio/m4a",
        "audio/x-m4a"
    ]);

    if (acceptedTypes.has(file.type)) {
        return file;
    }

    return new File(
        [file],
        file.name.toLowerCase().endsWith(".m4a")
            ? file.name
            : `${file.name}.m4a`,
        { type:"audio/mp4" }
    );
}

export async function downloadRecordVoice(
    goalId:number,
    recordId:number,
    signal?:AbortSignal
):Promise<Blob> {
    const response = await apiClient.get<Blob>(
        voicePath(goalId, recordId),
        {
            responseType:"blob",
            timeout:30000,
            signal
        }
    );

    return response.data;
}

export async function uploadRecordVoice(
    goalId:number,
    recordId:number,
    file:File
):Promise<void> {
    const form = new FormData();
    form.append(
        "audio",
        normalizeM4aFile(file)
    );

    await apiClient.post(
        voicePath(goalId, recordId),
        form,
        {
            timeout:30000
        }
    );
}

export async function deleteRecordVoice(
    goalId:number,
    recordId:number
):Promise<void> {
    await apiClient.delete(
        voicePath(goalId, recordId)
    );
}
