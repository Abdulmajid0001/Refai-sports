export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID ?? null;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY ?? null;
export const AWS_REGION = process.env.AWS_REGION ?? null;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME ?? null;

export const AWS_ENABLED = Boolean(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_REGION);

export function awsStatus() {
  if (!AWS_ENABLED) return "AWS not configured";
  return `AWS enabled for region ${AWS_REGION} and bucket ${AWS_BUCKET_NAME ?? "default"}`;
}
