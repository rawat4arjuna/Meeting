"use client";
import { useRouter } from "next/navigation";
import axios from "axios";
import React from "react";

const CreateMeeting: React.FC = () => {
  const router = useRouter();

  const createMeeting = async () => {
    try {
      const response = await axios.get("http://localhost:3001/create-meeting");
      const res = await axios.get("http://localhost:3001/create-user");
      const meetingId = response.data.meetingId;

      localStorage.setItem("meetingId", meetingId);
      localStorage.setItem("userId", res.data.userId);
      router.push(`/meeting/${meetingId}/${res.data.userId}`);
    } catch (error) {
      console.error("Error creating meeting:", error);
    }
  };

  return (
    <div>
      <h1>Create a New Meeting</h1>
      <button onClick={createMeeting}>Create Meeting</button>
    </div>
  );
};

export default CreateMeeting;
