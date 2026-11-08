"use client";import {track} from "./inventory";
export function WhatsAppLink({href,children,className}:{href:string;children:React.ReactNode;className?:string}){return <a href={href} className={className} onClick={()=>{if(navigator.doNotTrack!=="1")track("whatsapp_click")}}>{children}</a>}
