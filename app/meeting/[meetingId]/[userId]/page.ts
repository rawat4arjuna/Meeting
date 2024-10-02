import React from "react";

import Meeting from "./Meeting";
export async function generateStaticParams() {
  const meetingId = await localStorage.getItem("meetingId");
  const userId = await localStorage.getItem("userid");
  return { meetingId, userId };
}
const Page = ({
  params,
}: {
  params: { meetingId: string; userId: string };
}) => {
  return <Meeting params={params} />;
};

export default Page;
