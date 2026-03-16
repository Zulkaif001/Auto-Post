"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Post {
  id: string;
  text: string;
  status: "published" | "draft";
  date: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "published" | "drafts"
  >("published");

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      showToast(`LinkedIn sign-in failed: ${error}`, "error");
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);

  useEffect(() => {
    const savedPosts = localStorage.getItem("autopost_posts");
    const savedDrafts = localStorage.getItem("autopost_drafts");
    if (savedPosts) setPosts(JSON.parse(savedPosts));
    if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
  }, []);

  useEffect(() => {
    localStorage.setItem("autopost_posts", JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem("autopost_drafts", JSON.stringify(drafts));
  }, [drafts]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handlePost() {
    if (!postText.trim() || posting) return;

    setPosting(true);
    try {
      const res = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: postText,
          accessToken: (session as any)?.accessToken,
          linkedinId: (session as any)?.linkedinId,
        }),
      });

      if (res.ok) {
        const newPost: Post = {
          id: Date.now().toString(),
          text:
            postText.length > 50 ? postText.substring(0, 50) + "..." : postText,
          status: "published",
          date: new Date().toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        };
        setPosts((prev) => [newPost, ...prev]);
        setPostText("");
        showToast("Posted to LinkedIn successfully!", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to post", "error");
      }
    } catch {
      showToast("Failed to post to LinkedIn", "error");
    } finally {
      setPosting(false);
    }
  }

  function handleSaveDraft() {
    if (!postText.trim()) return;
    const newDraft: Post = {
      id: Date.now().toString(),
      text:
        postText.length > 50 ? postText.substring(0, 50) + "..." : postText,
      status: "draft",
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
    setDrafts((prev) => [newDraft, ...prev]);
    setPostText("");
    showToast("Draft saved!", "success");
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const publishedCount = posts.length;
  const draftsCount = drafts.length;
  const userName = session?.user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-500 text-sm">{getGreeting()} &#127780;</p>
            <h1 className="text-xl font-bold text-gray-900">{userName}</h1>
          </div>
          <div
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold cursor-pointer"
            onClick={() => (session ? signOut() : signIn("linkedin"))}
            title={session ? "Sign out" : "Sign in"}
          >
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-10 h-10 rounded-full"
              />
            ) : (
              userInitial
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mb-2">
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{publishedCount}</p>
            <p className="text-xs text-gray-500">Published</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-2">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500">Scheduled</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mb-2">
              <svg
                className="w-4 h-4 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{draftsCount}</p>
            <p className="text-xs text-gray-500">Drafts</p>
          </div>
        </div>

        {/* Post Composer */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What do you want to share?"
              rows={3}
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 resize-none outline-none bg-transparent"
            />
            <button
              onClick={handlePost}
              disabled={!postText.trim() || posting || !session}
              className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 disabled:opacity-40"
              title={!session ? "Connect LinkedIn first" : "Post to LinkedIn"}
            >
              {posting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
              ) : (
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
          {postText.trim() && (
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSaveDraft}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Save as Draft
              </button>
            </div>
          )}
        </div>

        {/* Connected Accounts */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3">
            Connected Accounts
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">LinkedIn</p>
                  <p className="text-xs text-gray-500">
                    {session?.user?.email || "Not connected"}
                  </p>
                </div>
              </div>
              {session ? (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  Connected
                </span>
              ) : (
                <button
                  onClick={() => signIn("linkedin")}
                  className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("published")}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  activeTab === "published"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setActiveTab("drafts")}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  activeTab === "drafts"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                Drafts
              </button>
            </div>
          </div>

          {activeTab === "published" && (
            <div className="space-y-2">
              {posts.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                  <p className="text-sm text-gray-400">
                    No posts yet. Share something!
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {post.text}
                      </p>
                      <p className="text-xs text-gray-400">
                        Published &middot; {post.date}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "drafts" && (
            <div className="space-y-2">
              {drafts.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                  <p className="text-sm text-gray-400">No drafts saved.</p>
                </div>
              ) : (
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {draft.text}
                      </p>
                      <p className="text-xs text-gray-400">
                        Draft &middot; {draft.date}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setPostText(draft.text);
                        setDrafts((prev) =>
                          prev.filter((d) => d.id !== draft.id)
                        );
                      }}
                      className="text-xs text-blue-500 shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
