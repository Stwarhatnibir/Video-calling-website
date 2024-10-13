const socket = io();
let localStream,
  screenStream,
  isScreenSharing = false,
  isCameraOn = true,
  isMuted = false;
let caller = [];
const roomId = window.location.pathname.split("/")[1]; // Get the room ID from URL

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const endCallBtn = document.getElementById("end-call-btn");
const shareScreenBtn = document.getElementById("share-screen-btn");
const toggleCameraBtn = document.getElementById("toggle-camera-btn");
const toggleMicBtn = document.getElementById("toggle-mic-btn");

// Peer Connection Management
const PeerConnection = (function () {
  let peerConnection;
  const createPeerConnection = () => {
    const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    peerConnection = new RTCPeerConnection(config);
    localStream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("icecandidate", {
          to: caller[1],
          candidate: event.candidate,
        });
      }
    };

    return peerConnection;
  };

  return {
    getInstance: () => peerConnection || createPeerConnection(),
  };
})();

// Start the local video stream
const startMyVideo = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStream = stream;
    localVideo.srcObject = stream;
  } catch (error) {
    console.error("Error accessing media devices:", error);
  }
};

// End the call
const endCall = () => {
  const pc = PeerConnection.getInstance();
  if (pc) {
    pc.close();
    endCallBtn.style.display = "none";
    socket.emit("call-ended", caller);
    resetUI();
  }
};

// Reset UI after call ends
const resetUI = () => {
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
};

// Share Screen Functionality
shareScreenBtn.addEventListener("click", async () => {
  if (!isScreenSharing) {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const pc = PeerConnection.getInstance();
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track.kind === "video");

      // Replace camera video track with screen track for the peer connection
      sender.replaceTrack(videoTrack);

      // Set localVideo to display the screen sharing stream
      localVideo.srcObject = screenStream;

      isScreenSharing = true;
      shareScreenBtn.innerHTML = '<i class="fas fa-stop"></i>';

      // Handle screen share ending
      screenStream.getTracks()[0].onended = () => stopScreenSharing();
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  } else {
    stopScreenSharing();
  }
});

const stopScreenSharing = () => {
  const videoTrack = localStream.getVideoTracks()[0];
  const sender = PeerConnection.getInstance()
    .getSenders()
    .find((s) => s.track.kind === "video");

  // Replace screen video track with camera video track for the peer connection
  sender.replaceTrack(videoTrack);

  // Revert localVideo to display the camera stream
  localVideo.srcObject = localStream;

  isScreenSharing = false;
  shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i>';
};

// Toggle Camera Functionality
toggleCameraBtn.addEventListener("click", () => {
  isCameraOn = !isCameraOn;
  localStream.getVideoTracks()[0].enabled = isCameraOn;
  toggleCameraBtn.innerHTML = isCameraOn
    ? '<i class="fas fa-video"></i>'
    : '<i class="fas fa-video-slash"></i>';
});

// Mute/Unmute Functionality
toggleMicBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  toggleMicBtn.innerHTML = isMuted
    ? '<i class="fas fa-microphone-slash"></i>'
    : '<i class="fas fa-microphone"></i>';
});

// Handle Call End
endCallBtn.addEventListener("click", () => {
  socket.emit("call-ended", caller);
  endCall();
});

// Initialize video on load
startMyVideo();
