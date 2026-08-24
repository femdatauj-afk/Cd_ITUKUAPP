"use client";

import { useEffect, useState } from "react";
import {
  addCommentReply,
  deletePostComment,
  editPostComment,
  fetchPostComments,
  toggleCommentReaction,
  uploadFile,
} from "../lib/api";

type CommentRecord = {
  id: string;
  parentId?: string | null;
  content: string;
  mediaUrl?: string | null;
  author?: { username?: string; fullName?: string };
  reactions?: Array<{ id: string }>;
};

export function CommentThread({ postId, basePath, onCountChange }: { postId: string; basePath?: string; onCountChange?: (count: number) => void }) {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [media, setMedia] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuCommentId, setMenuCommentId] = useState<string | null>(null);
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  async function refresh() {
    try {
      const next = await fetchPostComments(postId, basePath) as CommentRecord[];
      setComments(next);
      onCountChange?.(next.length);
    } catch {
      setError("Comments are unavailable right now.");
    }
  }

  useEffect(() => { refresh(); }, [postId]);

  async function submit() {
    if (!draft.trim() && !media) return;
    setLoading(true);
    setError("");
    try {
      let mediaUrl: string | undefined;
      if (media) mediaUrl = (await uploadFile(media, "comments")).data.url;
      if (editing) {
        const updated = await editPostComment(postId, editing, draft, basePath) as CommentRecord;
        setComments((current) => current.map((comment) => comment.id === editing ? { ...comment, ...updated } : comment));
      } else {
        const created = await addCommentReply(postId, replyTo || "", draft, mediaUrl, basePath) as CommentRecord;
        setComments((current) => [...current, created]);
        onCountChange?.(comments.length + 1);
      }
      setDraft("");
      setMedia(null);
      setReplyTo(null);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comment action failed.");
    } finally {
      setLoading(false);
    }
  }

  async function react(commentId: string) {
    try {
      const result = await toggleCommentReaction(postId, commentId, basePath);
      setComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, reactions: Array.from({ length: result.count }, (_, index) => ({ id: String(index) })) } : comment));
    } catch (err) { setError(err instanceof Error ? err.message : "Reaction failed."); }
  }

  async function remove(commentId: string) {
    try {
      await deletePostComment(postId, commentId, basePath);
      setComments((current) => current.filter((comment) => comment.id !== commentId && comment.parentId !== commentId));
      onCountChange?.(Math.max(0, comments.length - 1));
    } catch (err) { setError(err instanceof Error ? err.message : "Delete failed."); }
  }

  function renderComment(comment: CommentRecord, depth = 0) {
    const replies = comments.filter((item) => item.parentId === comment.id);
    return <div className="comment-thread-item" key={comment.id} style={{ marginLeft: Math.min(depth, 3) * 18 }}>
      <div className="comment-bubble" onContextMenu={(event) => { event.preventDefault(); setMenuCommentId(comment.id); }} onPointerDown={() => setPressTimer(setTimeout(() => setMenuCommentId(comment.id), 550))} onPointerUp={() => { if (pressTimer) clearTimeout(pressTimer); }} onPointerLeave={() => { if (pressTimer) clearTimeout(pressTimer); }}>
        <strong>{comment.author?.fullName || comment.author?.username || "Community member"}</strong>
        {editing === comment.id ? <input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Edit comment" /> : <span>{comment.content}</span>}
        {comment.mediaUrl ? <a href={comment.mediaUrl} target="_blank" rel="noreferrer">View attachment</a> : null}
      </div>
      <div className="comment-actions">
        <button type="button" onClick={() => react(comment.id)}>Like {comment.reactions?.length || 0}</button>
        <button type="button" onClick={() => { setReplyTo(comment.id); setEditing(null); setDraft(""); }}>Reply</button>
        {menuCommentId === comment.id ? <span className="comment-menu" role="menu"><button type="button" onClick={() => { setEditing(comment.id); setReplyTo(null); setDraft(comment.content); setMenuCommentId(null); }}>Edit</button><button type="button" onClick={() => { remove(comment.id); setMenuCommentId(null); }}>Delete</button></span> : null}
      </div>
      {replies.map((reply) => renderComment(reply, depth + 1))}
    </div>;
  }

  return <section className="comment-thread" aria-label="Comments">
    {comments.filter((comment) => !comment.parentId).map((comment) => renderComment(comment))}
    <div className="comment-composer">
      <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={replyTo ? "Write a reply..." : "Write a comment..."} aria-label={replyTo ? "Write a reply" : "Write a comment"} />
      <label className="comment-attach">{media ? "Media ready" : "Photo/video"}<input type="file" accept="image/*,video/mp4,video/webm" hidden onChange={(event) => setMedia(event.target.files?.[0] || null)} /></label>
      <button type="button" disabled={loading} onClick={submit}>{editing ? "Save" : replyTo ? "Reply" : "Comment"}</button>
    </div>
    {error ? <small className="comment-error">{error}</small> : null}
    <style jsx>{`.comment-thread{margin-top:10px}.comment-thread-item{margin-top:8px}.comment-bubble{display:flex;gap:7px;flex-wrap:wrap;background:#f3f8f2;border-radius:10px;padding:8px 10px;font-size:11px;touch-action:manipulation}.comment-bubble strong{color:#163d29}.comment-bubble a{color:#0b6737;width:100%}.comment-actions{display:flex;gap:10px;margin:3px 8px;align-items:center}.comment-actions button{border:0;background:none;color:#647268;font-size:10px;cursor:pointer;padding:0}.comment-menu{display:inline-flex;gap:8px;border:1px solid #dfe9e0;border-radius:8px;padding:5px 7px;background:#fff;box-shadow:0 4px 12px #163d291f}.comment-composer{display:flex;gap:7px;align-items:center;margin-top:10px}.comment-composer input{min-width:0;flex:1;border:1px solid #dfe9e0;border-radius:9px;padding:8px 10px;font:inherit;font-size:11px}.comment-composer button,.comment-attach{border:0;border-radius:999px;padding:8px 11px;background:#0b6737;color:#fff;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap}.comment-attach{background:#e7f0e6;color:#0b6737}.comment-error{display:block;color:#b42318;margin-top:6px}`}</style>
  </section>;
}
