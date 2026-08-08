import { supabase } from '@/integrations/supabase/client';

export async function uploadFile(bucket: string, file: File, folder: string) {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}
