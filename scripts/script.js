function statusMessageHTML(message) {
  return `
    <div class="msg status-msg">
      <p>
        <small class="time">(${message.time})</small> <strong class="from">${message.from}</strong> ${message.text}
      </p>
    </div>
  `;
}

function defaultMessageHTML(message) {
  return `
    <div class="msg default-msg">
      <p>
        <small class="time">(${message.time})</small> <strong class="from">${message.from}</strong> para
        <strong class="to">${message.to}</strong>: ${message.text}
      </p>
    </div>
  `;
}

function privateMessageHTML(message) {
  return `
    <div class="msg private-msg">
      <p>
        <small class="time">(${message.time})</small> <strong class="from">${message.from}</strong> reservadamente
        para <strong class="to">${message.to}</strong>: ${message.text}
      </p>
    </div>
  `;
}

function loadMessages() {
  const promise = axios.get(`${API}/messages`);
  promise.then(response => {
    log.classList.add("hidden");

    processMessages(response.data);
    timeout = setTimeout(loadMessages, 3000);
  });
}

function processMessages(messages) {
  const filteredMessages = messages.filter(
    message => message.type !== "private_message" || message.from === name || message.to === name
  );
  const mappedMessages = filteredMessages.map(message => {
    if (message.type === "status") {
      return statusMessageHTML(message);
    }

    if (message.type === "message") {
      return defaultMessageHTML(message);
    }

    return privateMessageHTML(message);
  });

  main.innerHTML = "";
  mappedMessages.forEach(message => (main.innerHTML += message));

  const realLastMessage = document.querySelector(".msg:last-child");
  if (lastMessage !== realLastMessage.innerText) {
    lastMessage = realLastMessage.innerText;
    realLastMessage.scrollIntoView();
  }
}

function login() {
  name = loginInput.value;
  loginInput.value = "";
  const promise = axios.post(`${API}/participants`, {name});

  promise.then(response => {
    loginContainer.classList.add("hidden");
    if (loader.classList.contains("hidden")) {
      loader.classList.remove("hidden");
    }

    loadMessages();
    keepLogged();
    getParticipants();
  });

  promise.catch(error => {
    loginContainer.classList.add("error-login");
  });
}

function keepLogged() {
  const promise = axios.post(`${API}/status`, {name});
  promise.then(response => setTimeout(keepLogged, 5000));
  promise.catch(error => window.location.reload());
}

function sendMessage() {
  const message = {
    from: name,
    to: recipient,
    text: input.value,
    type,
  };

  input.value = "";
  const promise = axios.post(`${API}/messages`, message);
  promise.then(response => {
    clearTimeout(timeout);
    loadMessages();
  });
}

function renderAside() {
  loadAside();
  toggleAside();
}

function loadAside() {
  const cls = recipient === "Todos" ? "selected" : "";
  console.log(cls);
  people.innerHTML = `
    <li class="${cls}">
      <div onclick="selectRecipient(this)">
        <ion-icon name="people"></ion-icon>
        <p>Todos</p>
      </div>
      <img src="images/check.svg" alt="checkmark" />
    </li>
  `;

  participants.forEach(participant => {
    const cls = participant.name === recipient ? "selected" : "";
    console.log(participant.name, recipient);
    people.innerHTML += `
      <li class="${cls}">
        <div onclick="selectRecipient(this)">
          <ion-icon name="person-circle"></ion-icon>
          <p>${participant.name}</p>
        </div>
        <img src="images/check.svg" alt="checkmark" />
      </li>
    `;
  });
}

function toggleAside() {
  aside.classList.toggle("hidden");
}

function selectRecipient(element) {
  const sel = document.querySelector(".people .selected");
  const parent = element.parentNode;
  recipient = parent.querySelector("p").innerText;

  if (sel !== null) {
    sel.classList.remove("selected");
  }

  parent.classList.add("selected");
  reloadSendInfo();
}

function selectVisibility(element) {
  const sel = document.querySelector(".viz .selected");
  const parent = element.parentNode;

  const viz = parent.querySelector("p").innerText;

  type = viz === "Público" ? "message" : "private_message";

  if (sel !== null) {
    sel.classList.remove("selected");
  }

  parent.classList.add("selected");
  reloadSendInfo();
}

function reloadSendInfo() {
  sendInfo.innerText = `Enviando para ${recipient}`;

  if (type === "private_message") {
    sendInfo.innerText += ` (reservadamente)`;
  }
}

function getParticipants() {
  const promise = axios.get(`${API}/participants`);
  promise.then(response => {
    participants = response.data;
    if (!participants.includes({name: recipient})) {
      recipient = "Todos";
      reloadSendInfo();
    }
    setTimeout(getParticipants, 10000);
  });
}

const API = "https://mock-api.driven.com.br/api/v6/uol";
const log = document.querySelector(".login");
const loginContainer = log.querySelector(".login-container");
const loginInput = loginContainer.querySelector("input");
const loginButton = loginContainer.querySelector("button");
const loader = log.querySelector(".loader");

const main = document.querySelector("main");
const aside = document.querySelector("aside");
const people = aside.querySelector(".people");

const input = document.querySelector("footer input");
const sendInfo = document.querySelector(".send-info");
const send = document.querySelector("footer ion-icon");

let name = null;
let recipient = "Todos";
let type = "message";
let lastMessage = null;
let participants = null;
let timeout = null;

loginInput.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    loginButton.click();
  }
});

input.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    send.click();
  }
});
