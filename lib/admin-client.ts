export type AdminFailure={code:string;message:string;fieldErrors?:Record<string,string>;requestId?:string};
export class AdminRequestError extends Error {constructor(public info:AdminFailure){super(info.message)}}
export async function adminRequest<T=Record<string,unknown>>(value:unknown,image=false):Promise<T>{
  let response:Response;
  try{response=await fetch(image?"/api/admin/image":"/api/admin",{method:"POST",headers:image?{}:{"Content-Type":"application/json"},body:image?value as FormData:JSON.stringify(value)});}
  catch{throw new AdminRequestError({code:"NETWORK",message:"İnternet bağlantısı kəsildi. Yazdıqlarınız itməyib; yenidən cəhd edin."})}
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new AdminRequestError(data?.code?data:{code:"REQUEST",message:response.status===403?"Sessiya bitib və ya icazə yoxdur. Yeni pəncərədə yenidən daxil olun.":"Əməliyyat tamamlanmadı. Yenidən cəhd edin."});
  return data as T;
}
