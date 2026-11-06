import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../services/apiClient';

export type ChatMessage = {id:string;authorId:number;authorName:string;text:string;createdAt:string;removed:boolean};
type Presence = {userId:number;handRaised:boolean;reaction:string|null};
type Feed = {messages:ChatMessage[];totalPages:number;presence:Presence[]};
export function useRoomCollaboration(roomId:string) {
    const [feed,setFeed]=useState<Feed|null>(null),[page,setPage]=useState(0);
    const [revision,setRevision]=useState(0);
    const [text,setText]=useState(''),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
    const pending=useRef<{id:string;text:string}|null>(null);
    const endpoint=`/api/study-rooms/${roomId}/collaboration`;
    const reload=useCallback(async(signal?:AbortSignal)=>{
        const {data}=await apiClient.get<Feed>(endpoint,{params:{page,revision},signal});
        if(!signal?.aborted){setFeed(data);}
    },[endpoint,page,revision]);
    useEffect(()=>{
        const controller=new AbortController();let loading=false;
        const poll=async()=>{if(loading)return;loading=true;try{await reload(controller.signal);}catch{if(!controller.signal.aborted){setFeed(null);setError('Chat unavailable. Check connection and room membership.');}}finally{loading=false;}};
        void poll();const timer=setInterval(()=>void poll(),2500);
        return ()=>{controller.abort();clearInterval(timer);};
    },[reload]);
    async function action(path:string,body?:unknown,method:'post'|'put'|'delete'='post') {
        if(busy)return;setBusy(true);setError(null);
        try{await apiClient.request({url:endpoint+path,method,data:body});setRevision(value=>value+1);}
        catch{setError('Action failed. Check membership or wait a moment before retrying.');}
        finally{setBusy(false);}
    }
    async function send() {
        if(busy||!text.trim())return;
        if(!pending.current||pending.current.text!==text.trim())pending.current={id:crypto.randomUUID(),text:text.trim()};
        setBusy(true);setError(null);
        try{await apiClient.post(endpoint+'/messages',pending.current);pending.current=null;setText('');setPage(0);setRevision(value=>value+1);}
        catch{setError('Message not confirmed. Retry keeps the same message ID to avoid duplicates.');}
        finally{setBusy(false);}
    }
    return {feed,page,setPage,text,setText,error,busy,send,action};
}
