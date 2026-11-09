import type {SupabaseClient} from '@supabase/supabase-js';
// Failed Storage requests remain queued for the owner's next retry. Never remove a referenced file.
export async function cleanImages(db:SupabaseClient){
 const queue=await db.from('image_cleanup').select('path').limit(50);
 if(queue.error)return false;
 let clean=true;
 for(const {path} of queue.data){
  const ref=await db.from('product_images').select('id').eq('path',path).limit(1);
  if(ref.error){clean=false;continue;}
  if(!ref.data.length){const removed=await db.storage.from('product-images').remove([path]);if(removed.error){clean=false;continue;}}
  const cleared=await db.from('image_cleanup').delete().eq('path',path);if(cleared.error)clean=false;
 }
 return clean;
}
