import helpers from "./helpers.js";

window.addEventListener("load", () => {
  // When the chat icon is clicked
  document.querySelector("#toggle-chat-pane").addEventListener("click", (e) => {
    let chatElem = document.querySelector("#chat-pane");
    let mainSecElem = document.querySelector("#main-section");

    if (chatElem.classList.contains("chat-opened")) {
      chatElem.setAttribute("hidden", true);
      mainSecElem.classList.remove("col-md-9");
      mainSecElem.classList.add("col-md-12");
      chatElem.classList.remove("chat-opened");
    } else {
      chatElem.attributes.removeNamedItem("hidden");
      mainSecElem.classList.remove("col-md-12");
      mainSecElem.classList.add("col-md-9");
      chatElem.classList.add("chat-opened");

      chatElem.style.zIndex = "1003";
    }

    setTimeout(() => {
      if (
        document.querySelector("#chat-pane").classList.contains("chat-opened")
      ) {
        helpers.toggleChatNotificationBadge();
      }
    }, 300);
  });

  // Automatically join a room or create a new one
  let roomName = helpers.getQString(location.href, "room");

  if (!roomName) {
    // First load, generate room
    roomName = `room_${helpers.generateRandomString()}`;
    const roomLink = `${location.origin}?room=${roomName}`;
    location.href = roomLink;
  } else {
    // If a room exists and page has not been reloaded yet
    if (!sessionStorage.getItem("hasReloaded")) {
      // Mark as reloaded and reload the page
      sessionStorage.setItem("hasReloaded", "true");
      location.reload();
    }
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
