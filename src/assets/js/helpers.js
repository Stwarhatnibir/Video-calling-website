export default {
  generateRandomString() {
    const crypto = window.crypto || window.msCrypto;
    let array = new Uint32Array(1);

    return crypto.getRandomValues(array)[0].toString(36); // Convert random value to base36 for a shorter string
  },

  // Remove the close button and adjust video element size when a stream is added/removed
  closeVideo(elemId) {
    if (document.getElementById(elemId)) {
      document.getElementById(elemId).remove();
      this.adjustVideoElemSize(); // Keep adjusting the size based on available videos
    }
  },

  pageHasFocus() {
    return !(
      document.hidden ||
      document.onfocusout ||
      window.onpagehide ||
      window.onblur
    );
  },

  // Generate or extract room name from the URL, no need for manual entry
  getQString(url = "", keyToReturn = "") {
    url = url || location.href;
    let queryStrings = decodeURIComponent(url)
      .split("#", 2)[0]
      .split("?", 2)[1];

    if (queryStrings) {
      let splittedQStrings = queryStrings.split("&");

      if (splittedQStrings.length) {
        let queryStringObj = {};

        splittedQStrings.forEach(function (keyValuePair) {
          let keyValue = keyValuePair.split("=", 2);
          if (keyValue.length) {
            queryStringObj[keyValue[0]] = keyValue[1];
          }
        });

        return keyToReturn
          ? queryStringObj[keyToReturn] || null
          : queryStringObj;
      }

      return null;
    }

    return null;
  },

  // Check if media devices are available for video/audio streaming
  userMediaAvailable() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  // Get user's media (audio + video) with basic audio features
  getUserFullMedia() {
    if (this.userMediaAvailable()) {
      return navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } else {
      throw new Error("User media not available");
    }
  },

  getUserAudio() {
    if (this.userMediaAvailable()) {
      return navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } else {
      throw new Error("User media not available");
    }
  },

  // Sharing screen functionality with audio
  shareScreen() {
    if (this.userMediaAvailable()) {
      return navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
    } else {
      throw new Error("User media not available");
    }
  },

  // Ice servers setup for WebRTC connection
  getIceServer() {
    return {
      iceServers: [
        { urls: ["stun:eu-turn4.xirsys.com"] },
        {
          username:
            "ml0jh0qMKZKd9P_9C0UIBY2G0nSQMCFBUXGlk6IXDJf8G2uiCymg9WwbEJTMwVeiAAAAAF2__hNSaW5vbGVl",
          credential: "4dd454a6-feee-11e9-b185-6adcafebbb45",
          urls: [
            "turn:eu-turn4.xirsys.com:80?transport=udp",
            "turn:eu-turn4.xirsys.com:3478?transport=tcp",
          ],
        },
      ],
    };
  },

  addChat(data, senderType) {
    let chatMsgDiv = document.querySelector("#chat-messages");
    let contentAlign = "justify-content-end";
    let senderName = "You";
    let msgBg = "bg-white";

    if (senderType === "remote") {
      contentAlign = "justify-content-start";
      senderName = data.sender;
      msgBg = "";
      this.toggleChatNotificationBadge();
    }

    let infoDiv = document.createElement("div");
    infoDiv.className = "sender-info";
    infoDiv.innerText = `${senderName} - ${moment().format(
      "Do MMMM, YYYY h:mm a"
    )}`;

    let colDiv = document.createElement("div");
    colDiv.className = `col-10 card chat-card msg ${msgBg}`;
    colDiv.innerHTML = xssFilters
      .inHTMLData(data.msg)
      .autoLink({ target: "_blank", rel: "nofollow" });

    let rowDiv = document.createElement("div");
    rowDiv.className = `row ${contentAlign} mb-2`;

    colDiv.appendChild(infoDiv);
    rowDiv.appendChild(colDiv);
    chatMsgDiv.appendChild(rowDiv);

    if (this.pageHasFocus()) {
      rowDiv.scrollIntoView();
    }
  },

  toggleChatNotificationBadge() {
    const chatPane = document.querySelector("#chat-pane");
    const notificationElem = document.querySelector("#new-chat-notification");

    if (chatPane.classList.contains("chat-opened")) {
      notificationElem.setAttribute("hidden", true);
    } else {
      notificationElem.removeAttribute("hidden");
    }
  },

  replaceTrack(stream, recipientPeer) {
    let sender = recipientPeer.getSenders
      ? recipientPeer
          .getSenders()
          .find((s) => s.track && s.track.kind === stream.kind)
      : false;

    if (sender) sender.replaceTrack(stream);
  },

  toggleShareIcons(share) {
    let shareIconElem = document.querySelector("#share-screen");

    if (share) {
      shareIconElem.setAttribute("title", "Stop sharing screen");
      shareIconElem.children[0].classList.add("text-primary");
      shareIconElem.children[0].classList.remove("text-white");
    } else {
      shareIconElem.setAttribute("title", "Share screen");
      shareIconElem.children[0].classList.add("text-white");
      shareIconElem.children[0].classList.remove("text-primary");
    }
  },

  toggleVideoBtnDisabled(disabled) {
    document.getElementById("toggle-video").disabled = disabled;
  },

  maximiseStream(e) {
    let elem = e.target.parentElement.previousElementSibling;
    elem.requestFullscreen() ||
      elem.mozRequestFullScreen() ||
      elem.webkitRequestFullscreen() ||
      elem.msRequestFullscreen();
  },

  singleStreamToggleMute(e) {
    if (e.target.classList.contains("fa-microphone")) {
      e.target.parentElement.previousElementSibling.muted = true;
      e.target.classList.add("fa-microphone-slash");
      e.target.classList.remove("fa-microphone");
    } else {
      e.target.parentElement.previousElementSibling.muted = false;
      e.target.classList.add("fa-microphone");
      e.target.classList.remove("fa-microphone-slash");
    }
  },

  setLocalStream(stream, mirrorMode = true) {
    const localVidElem = document.getElementById("local");

    localVidElem.srcObject = stream;
    mirrorMode
      ? localVidElem.classList.add("mirror-mode")
      : localVidElem.classList.remove("mirror-mode");
  },

  adjustVideoElemSize() {
    let elem = document.getElementsByClassName("card");
    let totalRemoteVideosDesktop = elem.length;
    let newWidth =
      totalRemoteVideosDesktop <= 2
        ? "50%"
        : totalRemoteVideosDesktop == 3
        ? "33.33%"
        : totalRemoteVideosDesktop <= 8
        ? "25%"
        : totalRemoteVideosDesktop <= 15
        ? "20%"
        : totalRemoteVideosDesktop <= 18
        ? "16%"
        : totalRemoteVideosDesktop <= 23
        ? "15%"
        : totalRemoteVideosDesktop <= 32
        ? "12%"
        : "10%";

    for (let i = 0; i < totalRemoteVideosDesktop; i++) {
      elem[i].style.width = newWidth;
    }
  },

  // Automatically create demo videos and adjust their layout
  createDemoRemotes(str, total = 6) {
    let i = 0;
    let testInterval = setInterval(() => {
      let newVid = document.createElement("video");
      newVid.id = `demo-${i}-video`;
      newVid.srcObject = str;
      newVid.autoplay = true;
      newVid.className = "remote-video";

      let controlDiv = document.createElement("div");
      controlDiv.className = "remote-video-controls";
      controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

      let cardDiv = document.createElement("div");
      cardDiv.className = "card card-sm";
      cardDiv.id = `demo-${i}`;
      cardDiv.appendChild(newVid);
      cardDiv.appendChild(controlDiv);

      document.getElementById("videos").appendChild(cardDiv);
      this.adjustVideoElemSize();

      i++;

      if (i == total) {
        clearInterval(testInterval);
      }
    }, 2000);
  },
};
