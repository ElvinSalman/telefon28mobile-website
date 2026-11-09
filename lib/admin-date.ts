// Explicit separators avoid Node/Chrome ICU locale differences during hydration.
export function adminDate(value:string):string {
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Baku',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));
 const part=(name:string)=>parts.find(p=>p.type===name)?.value||'';
 return `${part('day')}.${part('month')}.${part('year')} ${part('hour')}:${part('minute')}:${part('second')}`;
}
