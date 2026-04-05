"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import { mockUsers } from "@/data/mock/users";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" || user.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Community Users
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Users</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.4fr_220px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username..."
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all</option>
            <option value="active">active</option>
            <option value="flagged">flagged</option>
          </select>
        </div>

        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="rounded-[24px] border border-line bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-text">{user.username}</h2>
                  <p className="mt-2 text-sm text-sub">
                    XP: {user.xp} • Level: {user.level} • Streak: {user.streak}
                  </p>
                </div>

                <p
                  className={`text-sm font-semibold capitalize ${
                    user.status === "flagged" ? "text-danger" : "text-primary"
                  }`}
                >
                  {user.status}
                </p>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 ? (
            <div className="rounded-[24px] border border-line bg-card p-6 text-sm text-sub">
              No users match your filters.
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}