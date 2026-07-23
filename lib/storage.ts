import { createClient } from "@supabase/supabase-js";

// Server-only client using the secret key — bypasses Storage RLS entirely, so this
// must never be imported into client components or exposed to the browser. Used for
// uploading/reading files where the app's own auth (not Supabase Auth) already
// gated access before this is called.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export const CLOSING_CHECKLIST_PHOTOS_BUCKET = "closing-checklist-photos";

/** Uploads a photo and returns the storage path (not a public URL — this bucket is
 * private, so callers must use `getSignedPhotoUrl` to generate a temporary viewable
 * link when displaying the photo later). */
export async function uploadClosingChecklistPhoto(
  branchId: string,
  department: string,
  date: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const path = `${branchId}/${date}/${department}.${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(CLOSING_CHECKLIST_PHOTOS_BUCKET)
    .upload(path, file, { contentType, upsert: true });

  if (error) throw new Error(`Failed to upload photo: ${error.message}`);

  return path;
}

/** Generates a temporary (1 hour) signed URL for viewing a private photo. */
export async function getSignedPhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(CLOSING_CHECKLIST_PHOTOS_BUCKET)
    .createSignedUrl(path, 3600);

  if (error) throw new Error(`Failed to create signed URL: ${error.message}`);

  return data.signedUrl;
}
