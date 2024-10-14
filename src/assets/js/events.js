import helpers from "./helpers.js";

window.addEventListener("load", () => {
  // Automatically join a room or create a new one
  let roomName = helpers.getQString(location.href, "room");

  if (!roomName) {
    roomName = `room_${helpers.generateRandomString()}`;
    const roomLink = `${location.origin}?room=${roomName}`;
    location.href = roomLink;
  }

  // Set a random username in session storage
  sessionStorage.setItem("username", `user_${helpers.generateRandomString()}`);

  // Setup the video call
  setupVideoCall();
});

function setupVideoCall() {
  if (helpers.userMediaAvailable()) {
    helpers
      .getUserFullMedia()
      .then((stream) => {
        helpers.setLocalStream(stream);
        // Additional video setup such as adding remote participants
        console.log("Local stream set successfully");
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });
  } else {
    console.error("Media devices not available.");
  }

  // Chat, video interaction logic
  document.getElementById("local").addEventListener("click", () => {
    if (!document.pictureInPictureElement) {
      document.getElementById("local").requestPictureInPicture();
    } else {
      document.exitPictureInPicture();
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("expand-remote-video")) {
      helpers.maximiseStream(e);
    } else if (e.target && e.target.classList.contains("mute-remote-mic")) {
      helpers.singleStreamToggleMute(e);
    }
  });

  document.getElementById("closeModal").addEventListener("click", () => {
    helpers.toggleModal("recording-options-modal", false);
  });
}
