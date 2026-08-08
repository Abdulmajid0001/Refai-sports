import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";


const schema = z.object({ body: z.string().trim().min(1, "Say something").max(2000) });

type Comment = { id: string; author_name: string; body: string; created_at: string };

export function CommentBox() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const { data: comments } = useQuery({
    queryKey: ["site_comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_comments")
        .select("id,author_name,body,created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Comment[];
    },
  });

  const post = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ body });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!user) throw new Error("Sign in to post");
      const author =
        (user.user_metadata?.display_name as string | undefined) ||
        user.email?.split("@")[0] ||
        "User";
      const { error } = await supabase.from("site_comments").insert({
        user_id: user.id,
        author_name: author,
        body: parsed.data.body,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      toast.success("Posted");
      qc.invalidateQueries({ queryKey: ["site_comments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h2 className="font-display text-2xl font-bold">Join the conversation</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Share your take on Refai. Be respectful — comments are public.
      </p>

      <div className="mt-6 space-y-3">
        {user ? (
          <>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={2000}
              rows={4}
            />
            <div className="flex justify-end">
              <Button onClick={() => post.mutate()} disabled={post.isPending || body.trim().length === 0}>
                {post.isPending ? "Posting…" : "Post comment"}
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
            <a href="/auth" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </a>{" "}
            to leave a comment.
          </div>
        )}
      </div>

      <ul className="mt-8 space-y-4">
        {comments?.map((c) => (
          <li key={c.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{c.author_name}</span>
              <time className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</time>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{c.body}</p>
          </li>
        ))}
        {comments && comments.length === 0 && (
          <li className="text-sm text-muted-foreground">Be the first to comment.</li>
        )}
      </ul>
    </section>
  );
}
