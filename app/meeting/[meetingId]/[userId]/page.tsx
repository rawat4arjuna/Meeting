"use client";
import React from "react";
import Meeting from "./Meeting";

export default function Page({
  params,
}: {
  params: { meetingId: string; userId: string };
}) {
  return (
    <div>
      <Meeting params={params} />
    </div>
  );
}
