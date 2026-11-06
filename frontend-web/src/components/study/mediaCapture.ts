/** Keep late browser capture completions from surviving a room change or unmount. */
export interface CaptureRoom {
    localParticipant: {
        isScreenShareEnabled: boolean;
        setScreenShareEnabled(enabled: boolean, options: {audio: boolean}): Promise<unknown>;
    };
    disconnect(stopTracks: boolean): Promise<void>;
}
export async function toggleScreenCapture(room: CaptureRoom, isCurrent: () => boolean): Promise<void> {
    try {
        await room.localParticipant.setScreenShareEnabled(!room.localParticipant.isScreenShareEnabled, {audio:false});
    } finally {
        if (!isCurrent()) await room.disconnect(true);
    }
}
