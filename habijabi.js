var connection = new WebSocket("ws://demeterwel.com/faochatws");

var name = "";

var loginInput = document.querySelector("#loginInput");
var loginBtn = document.querySelector("#loginBtn");
var msgBtn = document.querySelector("#sendMsgBtn");
var nameBox = document.querySelector("#name-box");
var chatItem = document.querySelector("#userchat");
var innerItem = document.querySelector("#innerItem");

var otherUsernameInput = document.querySelector("#otherUsernameInput");

var connectToOtherUsernameBtn = document.querySelector(
  "#connectToOtherUsernameBtn"
);
var msgInput = document.querySelector("#msgData");

var msgContainer = document.querySelector("#msgs");

var connectedUser, rtcConnection, dataChannel;

//when a user clicks the login button
loginBtn.addEventListener("click", function (event) {
  name = loginInput.value;

  if (name.length > 0) {
    send({
      messageType: "login",
      name: name,
    });
  }
});
msgBtn.addEventListener("click", function (event) {
  msg = msgInput.value;
  if (msg.length > 0) {
    try {
      dataChannel.send(msg);
      addMsg(msg, true);
    } catch (e) {
      alert("Error with rtc, please reload site");
    }
  }
});
connectToOtherUsernameBtn.addEventListener("click", function (event) {
  connectedUser = otherUsernameInput.value;
  openDataChannel();
  console.log("Creating offer");
  if (connectedUser.length > 0) {
    rtcConnection.createOffer(
      function (offer) {
        console.log();
        send({
          messageType: "offer",
          offer: offer,
        });

        rtcConnection.setLocalDescription(offer);
      },
      function (error) {
        alert("An error has occurred.");
      }
    );
  }
});

connection.onmessage = function (message) {
  console.log(message);
  var data = JSON.parse(message.data);
  switch (data.messageType) {
    case "login":
      console.log("rtc connection created");
      if (data.success) {
        nameBox.innerHTML = "Welcome " + loginInput.value;
        var configuration = {
          configuration: {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1,
          },
          iceServers: [
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
            { urls: "stun:stun01.sipphone.com" },
            { urls: "stun:stun.ekiga.net" },
            { urls: "stun:stun.fwdnet.net" },
            { urls: "stun:stun.ideasip.com" },
            { urls: "stun:stun.iptel.org" },
            { urls: "stun:stun.rixtelecom.se" },
            { urls: "stun:stun.schlund.de" },
            { urls: "stun:stunserver.org" },
            { urls: "stun:stun.softjoys.com" },
            { urls: "stun:stun.voiparound.com" },
            { urls: "stun:stun.voipbuster.com" },
            { urls: "stun:stun.voipstunt.com" },
            { urls: "stun:stun.voxgratia.org" },
            { urls: "stun:stun.xten.com" },
            {
              urls: "turn:numb.viagenie.ca",
              credential: "imranastha",
              username: "imranh920@gmail.com",
            },
          ],
        };
        console.log("rtc connection created");
        rtcConnection = new RTCPeerConnection(configuration);

        console.log("rtc connection created");
        console.log(rtcConnection);

        rtcConnection.onicecandidate = function (event) {
          console.log(event);
          if (event.candidate) {
            console.log("local ice candidate received");
            console.log(event);
            send({
              messageType: "candidate",
              candidate: event.candidate,
            });
          }
        };
        rtcConnection.ondatachannel = (event) => {
          dataChannel = event.channel;
          subscribeToDataChannel();
        };
      }
      break;
    case "offer":
      nameBox.innerHTML = loginInput.value + " & " + data.name;
      console.log("offer received");
      onOffer(data);
      console.log(message);
      break;
    case "answer":
      console.log("answer received");
      nameBox.innerHTML = loginInput.value + " & " + data.name;
      onAnswer(data);
      console.log(message);
      break;
    case "candidate":
      console.log("candidate received from other user");
      onCandidate(data);
      console.log(message);
      break;
  }
};
function onOffer(data) {
  connectedUser = data.name;
  rtcConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

  rtcConnection.createAnswer(
    function (answer) {
      rtcConnection.setLocalDescription(answer);
      send({
        messageType: "answer",
        answer: answer,
      });
    },
    function (error) {
      alert("oops...error");
    }
  );
}
function onAnswer(data) {
  rtcConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
}
function onCandidate(data) {
  rtcConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
}
function send(message) {
  if (connectedUser) {
    message.name = connectedUser;
  }

  connection.send(JSON.stringify(message));
}
function openDataChannel() {
  var dataChannelOptions = {
    reliable: true,
  };

  dataChannel = rtcConnection.createDataChannel(
    "myDataChannel",
    dataChannelOptions
  );
  subscribeToDataChannel();
}
function subscribeToDataChannel() {
  dataChannel.onerror = function (error) {
    console.log("Error:", error);
  };

  dataChannel.onmessage = function (event) {
    console.log("Got message:", event.data);
    addMsg(event.data, false);
    beep();
  };
}
function addMsg(msg, isMe) {
  var itm = chatItem.cloneNode();
  var itmDiv = innerItem.cloneNode();
  itmDiv.innerHTML = msg;
  itmDiv.style["float"] = isMe ? "right" : "left";
  itm.appendChild(itmDiv);
  msgContainer.appendChild(itm);
  msgContainer.scrollTop = msgContainer.scrollHeight;
  if (isMe) msgInput.value = "";
}
function handleKeyPress(e) {
  if (e.keyCode === 13) {
    e.preventDefault(); // Ensure it is only this code that rusn
    msg = msgInput.value;
    if (msg.length > 0) {
      try {
        dataChannel.send(msg);
        addMsg(msg, true);
      } catch (e) {
        alert("Error with rtc, please reload site");
      }
    }
  }
}
function beep() {
  var snd = new Audio(
    "data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU="
  );
  snd.play();
}
