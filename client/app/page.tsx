"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [data, setData] = useState("Loading database timestamp...");

  useEffect(() => {
    axios
      .get("http://localhost:5000/db-test")
      .then((res) => setData(res.data[0].now))
      .catch((err) => {
        console.error(err);
        setData("Unable to reach backend database test endpoint.");
      });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">{data}</h1>
    </div>
  );
}
