type ServerFnContext = { context?: { userId?: unknown; user?: { id?: unknown } } };

export async function requireSupabaseAuth({ context }: ServerFnContext = {}) {
  const userId = context?.userId ?? context?.user?.id;

  if (!userId || typeof userId !== "string") {
    throw new Error("Authentication required");
  }

  return { userId };
}
