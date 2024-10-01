import React, { useRef, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

const VideoCall: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    setSocket(socket);

    const configuration: RTCConfiguration = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    socket.on("offer", async (data: RTCSessionDescriptionInit) => {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer", answer);
    });

    socket.on("answer", (data: RTCSessionDescriptionInit) => {
      peerConnection.setRemoteDescription(new RTCSessionDescription(data));
    });

    socket.on("candidate", (data: RTCIceCandidateInit) => {
      const candidate = new RTCIceCandidate(data);
      peerConnection.addIceCandidate(candidate);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createOffer = async () => {
    if (peerConnectionRef.current && socket) {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socket.emit("offer", offer);
    }
  };

  return (
    <div>
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "300px", height: "200px" }}
      ></video>
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: "300px", height: "200px" }}
      ></video>
      <button onClick={createOffer}>Start Call</button>
    </div>
  );
};

export default VideoCall;
