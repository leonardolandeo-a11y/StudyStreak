import { useEffect, useRef, useState } from 'react';
export interface LocalTrack { id: string; name: string; url: string; signature: string }
const formats: Record<string,string> = {mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',m4a:'audio/mp4',aac:'audio/aac',flac:'audio/flac',webm:'audio/webm'};
/** Session-only files: one media element, explicit user playback, no uploads or storage. */
export function useLocalMusic(volume: number, beforePlay: () => void) {
    const files = useRef(new Map<string,LocalTrack>());
    const media = useRef<HTMLAudioElement | null>(null);
    const revision = useRef(0);
    const [tracks,setTracks] = useState<LocalTrack[]>([]);
    const [selected,setSelected] = useState<string | null>(null);
    const [playing,setPlaying] = useState(false);
    const [error,setError] = useState<string | null>(null);
    useEffect(() => { if(media.current) media.current.volume=volume; },[volume]);
    useEffect(() => () => {
        revision.current++;
        if(media.current){media.current.onended=null;media.current.onerror=null;media.current.pause();media.current.removeAttribute('src');media.current.load();}
        media.current=null;
        for(const track of files.current.values())URL.revokeObjectURL(track.url);
        files.current.clear();
    },[]);
    function player() {
        if(!media.current){media.current=new Audio();media.current.preload='metadata';media.current.onended=()=>setPlaying(false);media.current.onerror=()=>{revision.current++;setPlaying(false);setError('This audio file could not be decoded. Try MP3, WAV or another format supported by your browser.');};}
        return media.current;
    }
    function pause(clear=false) {
        revision.current++;media.current?.pause();setPlaying(false);
        if(clear)setSelected(null);
    }
    function importFiles(input: FileList | null) {
        if(!input)return;
        const rejected:string[]=[];
        for(const file of Array.from(input)){
            const extension=file.name.split('.').at(-1)?.toLowerCase()??'';
            const mime=file.type.startsWith('audio/')?file.type:formats[extension];
            if(!file.size||!mime||!player().canPlayType(mime)){rejected.push(file.name);continue;}
            const signature=`${file.name}:${file.size}:${file.lastModified}`;
            if([...files.current.values()].some(track=>track.signature===signature))continue;
            try{const id=crypto.randomUUID();files.current.set(id,{id,name:file.name,url:URL.createObjectURL(file),signature});}catch{rejected.push(file.name);}
        }
        setTracks([...files.current.values()]);setError(rejected.length?`Unsupported or empty audio: ${rejected.join(', ')}.`:null);
    }
    async function play(id: string) {
        const track=files.current.get(id);if(!track)return;
        if(selected===id&&playing){pause();return;}
        beforePlay();const attempt=++revision.current;const audio=player();audio.pause();
        if(audio.getAttribute('src')!==track.url)audio.src=track.url;
        audio.volume=volume;setSelected(id);setError(null);setPlaying(false);
        try{await audio.play();if(attempt===revision.current)setPlaying(true);}catch{if(attempt===revision.current){setPlaying(false);setError(`Could not play ${track.name}. The format may be unsupported or playback blocked.`);}}
    }
    function remove(id: string) {
        const track=files.current.get(id);if(!track)return;
        if(selected===id || media.current?.getAttribute('src')===track.url){pause(true);media.current?.removeAttribute('src');media.current?.load();}
        files.current.delete(id);URL.revokeObjectURL(track.url);setTracks([...files.current.values()]);
    }
    return {tracks,selected,playing,error,importFiles,play,pause,remove,current:tracks.find(track=>track.id===selected)};
}
