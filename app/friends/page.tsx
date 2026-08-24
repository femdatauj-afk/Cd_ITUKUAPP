"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/app-shell";
import { fetchCommunityUsers, followUser, getSeededUsers, getSession, sendFriendRequest, unfriendUser, unfollowUser } from "../lib/api";

type Person = { id: string; fullName: string; username: string; village: string; bio?: string; profilePhoto?: string; isVerified?: boolean; friendshipStatus?: string | null; isFollowing?: boolean };

const initials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

function Avatar({ person }: { person: Person }) {
  return person.profilePhoto ? <img className="people-avatar" src={person.profilePhoto} alt={`${person.fullName} profile`} /> : <span className="people-avatar people-avatar-fallback">{initials(person.fullName)}</span>;
}

export default function FriendsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [tab, setTab] = useState<"people" | "friends">("people");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const currentUser = getSession()?.user?.id;
    fetchCommunityUsers()
      .then((users) => setPeople((users as Person[]).filter((person) => person.id !== currentUser)))
      .catch(() => setPeople(getSeededUsers().filter((person) => person.id !== currentUser) as Person[]));
  }, []);

  const visiblePeople = useMemo(() => people.filter((person) => `${person.fullName} ${person.username} ${person.village}`.toLowerCase().includes(query.toLowerCase()) && (tab === "people" || person.friendshipStatus === "friend")), [people, query, tab]);
  const updatePerson = (id: string, update: Partial<Person>) => setPeople((current) => current.map((person) => person.id === id ? { ...person, ...update } : person));
  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2200); };

  const toggleFriend = async (person: Person) => {
    if (person.friendshipStatus === "friend") {
      try { await unfriendUser(person.id); } catch { /* preview fallback */ }
      updatePerson(person.id, { friendshipStatus: null });
      flash(`${person.fullName} removed from your friends.`);
      return;
    }
    try { await sendFriendRequest(person.id); } catch { /* preview fallback */ }
    updatePerson(person.id, { friendshipStatus: "friend" });
    flash(`You are now connected with ${person.fullName}.`);
  };

  const toggleFollow = async (person: Person) => {
    const following = Boolean(person.isFollowing);
    try { following ? await unfollowUser(person.id) : await followUser(person.id); } catch { /* preview fallback */ }
    updatePerson(person.id, { isFollowing: !following });
    flash(`${following ? "Unfollowed" : "Following"} ${person.fullName}.`);
  };

  return <AppShell title="People and Friends" subtitle="Connect with people across the Ituku community.">
    <style jsx global>{`
      .people-page{display:grid;gap:18px}.people-toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.people-search{flex:1 1 280px;min-width:0;padding:13px 15px;border:1px solid #dce8dd;border-radius:12px;background:#fff;font:inherit}.people-tabs{display:flex;gap:8px}.people-tabs button,.person-actions button{border:1px solid #0b6737;border-radius:999px;background:#fff;color:#0b6737;padding:9px 14px;font-weight:800;cursor:pointer}.people-tabs button.active,.person-actions button.primary{background:#0b6737;color:#fff}.people-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}.person-card{display:grid;gap:12px;padding:18px;border:1px solid #e1ebe2;border-radius:18px;background:#fff;box-shadow:0 10px 24px rgba(17,54,33,.05)}.person-head{display:flex;align-items:center;gap:12px}.people-avatar{width:58px;height:58px;flex:0 0 58px;border-radius:50%;object-fit:cover}.people-avatar-fallback{display:grid;place-items:center;background:linear-gradient(135deg,#0b6737,#8ab94e);color:#fff;font-weight:900}.person-name{min-width:0}.person-name a{color:#142a1c;text-decoration:none;font-weight:900;overflow-wrap:anywhere}.person-name a:hover{text-decoration:underline}.person-name small,.person-bio{color:#657568}.person-bio{min-height:42px;margin:0;line-height:1.5;font-size:13px}.person-actions{display:flex;gap:8px;flex-wrap:wrap}.person-actions button{flex:1 1 105px}.person-actions a{flex:1 1 105px;text-align:center}.people-notice{padding:11px 14px;border-radius:12px;background:#edf8f0;color:#17613c;font-weight:700}
    `}</style>
    <div className="people-page">
      {notice ? <div className="people-notice" role="status">{notice}</div> : null}
      <section className="panel-card people-toolbar"><input className="people-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people by name, username, or village" aria-label="Search people" /><div className="people-tabs"><button type="button" className={tab === "people" ? "active" : ""} onClick={() => setTab("people")}>People</button><button type="button" className={tab === "friends" ? "active" : ""} onClick={() => setTab("friends")}>Friends</button></div></section>
      <section className="people-grid">{visiblePeople.map((person) => <article className="person-card" key={person.id}><div className="person-head"><Avatar person={person} /><div className="person-name"><Link href={`/profile/${person.username}`}>{person.fullName}{person.isVerified ? " ✓" : ""}</Link><small>@{person.username} · {person.village}</small></div></div><p className="person-bio">{person.bio || "Ituku community member."}</p><div className="person-actions"><button type="button" className={person.friendshipStatus === "friend" ? "primary" : ""} onClick={() => toggleFriend(person)}>{person.friendshipStatus === "friend" ? "Unfriend" : "Add friend"}</button><button type="button" className={person.isFollowing ? "primary" : ""} onClick={() => toggleFollow(person)}>{person.isFollowing ? "Unfollow" : "Follow"}</button><Link className="button secondary" href={`/profile/${person.username}`}>View profile</Link></div></article>)}</section>
    </div>
  </AppShell>;
}
