"use client";

import { useEffect, useState } from "react";

function formatKolkataTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(new Date(timestamp));
}

export default function Home() {
  const [data, setData] = useState("Loading database timestamp...");

  useEffect(() => {
    fetch("/api/db-test")
      .then(async (res) => {
        const body = await res.json();

        if (!res.ok) {
          throw new Error(body.error || "Backend request failed");
        }

        return body;
      })
      .then((res) => setData(formatKolkataTime(res.data[0].now)))
      .catch((err) => {
        console.error(err);
        setData(err.message || "Unable to reach backend database test endpoint.");
      });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">{data}</h1>
    </div>
  );
}
