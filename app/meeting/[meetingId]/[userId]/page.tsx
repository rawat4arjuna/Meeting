"use client";
import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useParams } from "next/navigation";

const Meeting = () => {
  const params = useParams();
  const meetingId = params.meetingId;
  const userId = params.userId; // Replace with your actual user ID logic

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteVideoRefs, setRemoteVideoRefs] = useState<{
    [key: string]: React.RefObject<HTMLVideoElement>;
  }>({});
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const socketRef = useRef<Socket | null>(null);
  const socketHandle = async () => {
    if (!meetingId) return;

    console.log("Connecting to socket server...");
    const socket = await io("http://localhost:3001");
    socketRef.current = socket;

    const configuration: RTCConfiguration = {
      iceServers: [
        {
          urls: "stun:stun1.l.google.com:19302",
        },
        {
          urls: "stun:stun2.l.google.com:19302",
        },
      ],
    };

    const createPeerConnection = (userId: string) => {
      console.log("Creating peer connection for user:", userId);
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionsRef.current[userId] = peerConnection;
      console.log("coming to hole");
      peerConnection.onicecandidate = (event) => {
        console.log("djdjhd", event);
        if (event.candidate) {
          console.log("Sending ICE candidate for user:", userId);
          socket.emit("candidate", {
            candidate: event.candidate,
            target: userId,
          });
        }
      };

      peerConnection.ontrack = (event) => {
        console.log("Received track for user:", userId);
        if (!remoteVideoRefs[userId]) {
          setRemoteVideoRefs((prev) => ({
            ...prev,
            [userId]: React.createRef<HTMLVideoElement>(),
          }));
        } else {
          const videoRef = remoteVideoRefs[userId];
          if (videoRef && videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        }
      };

      return peerConnection;
    };

    const handleNewUser = (userId: string) => {
      console.log("New user connected:", userId);
      if (!peerConnectionsRef.current[userId]) {
        const peerConnection = createPeerConnection(userId);

        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            console.log("Got local stream for user:", userId);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
            stream.getTracks().forEach((track) => {
              peerConnection.addTrack(track, stream);
            });
          })
          .catch((error) => {
            console.error("Error accessing media devices:", error);
          });
      }
    };

    socket.on("new-user", handleNewUser);

    socket.on("offer", async ({ sdp, sender }) => {
      console.log("Received offer from:", sender);
      if (!peerConnectionsRef.current[sender]) {
        const peerConnection = createPeerConnection(sender);
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", {
          sdp: peerConnection.localDescription,
          target: sender,
        });
      }
    });

    socket.on("answer", async ({ sdp, sender }) => {
      console.log("Received answer from:", sender);
      const peerConnection = peerConnectionsRef.current[sender];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );
      }
    });

    socket.on("candidate", ({ candidate, sender }) => {
      console.log("Received ICE candidate from:", sender);
      const peerConnection = peerConnectionsRef.current[sender];
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("user-disconnected", (userId: string) => {
      console.log("User disconnected:", userId);
      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        delete peerConnectionsRef.current[userId];
        setRemoteVideoRefs((prev) => {
          const newRefs = { ...prev };
          delete newRefs[userId];
          return newRefs;
        });
      }
    });

    console.log("Joining meeting with ID:", meetingId, "and user ID:", userId);
    socket.emit("join", { meetingId, userId });
  };
  useEffect(() => {
    socketHandle();
    return () => {
      console.log("Disconnecting and cleaning up...");
      socketRef.current?.disconnect();
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    };
  }, [meetingId]);

  console.log("Local video ref:", localVideoRef);
  console.log("Remote video refs:", remoteVideoRefs);

  return (
    <div>
      <h1>Meeting ID: {meetingId}</h1>
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "300px", height: "200px" }}
      ></video>
      <h1>User ID: {userId}</h1>
      {Object.keys(remoteVideoRefs).map((key) => (
        <video
          key={key}
          ref={remoteVideoRefs[key]}
          autoPlay
          playsInline
          style={{ width: "300px", height: "200px" }}
        ></video>
      ))}
    </div>
  );
};

export default Meeting;
