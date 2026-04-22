const { ipcRenderer, shell } = require('electron');

let tabs = [];
let activeTab = 0;
let downloads = [];

// ---------------- TABS ----------------

function newTab(url = "https://cse.google.com/cse?cx=c0a860223df054c6f") {
  const webview = document.createElement("webview");
  webview.src = url;

  document.getElementById("views").appendChild(webview);

  tabs.push({
    webview,
    title: "New Tab"
  });

  setupTitle(webview, tabs.length - 1);

  switchTab(tabs.length - 1);
  renderTabs();
}

function switchTab(i) {
  activeTab = i;

  tabs.forEach((t, index) => {
    t.webview.style.display = index === i ? "flex" : "none";
  });

  document.getElementById("urlbar").value = tabs[i].webview.src;
  renderTabs();
}

function renderTabs() {
  const el = document.getElementById("tabs");
  el.innerHTML = "";

  tabs.forEach((t, i) => {
    const tab = document.createElement("div");
    tab.className = "tab" + (i === activeTab ? " active" : "");

    tab.innerText = t.title;

    tab.onclick = () => switchTab(i);

    const close = document.createElement("span");
    close.innerText = " ✖";
    close.onclick = (e) => {
      e.stopPropagation();
      closeTab(i);
    };

    tab.appendChild(close);
    el.appendChild(tab);
  });
}

function closeTab(i) {
  tabs[i].webview.remove();
  tabs.splice(i, 1);

  if (tabs.length === 0) return newTab();

  activeTab = Math.max(0, activeTab - 1);
  switchTab(activeTab);
  renderTabs();
}

function setupTitle(webview, i) {
  webview.addEventListener("page-title-updated", (e) => {
    tabs[i].title = e.title;
    renderTabs();
  });
}

// ---------------- NAV ----------------

function go() {
  let url = document.getElementById("urlbar").value;
  if (!url.startsWith("http")) url = "https://" + url;
  tabs[activeTab].webview.src = url;
}

function back() { tabs[activeTab].webview.goBack(); }
function forward() { tabs[activeTab].webview.goForward(); }
function reload() { tabs[activeTab].webview.reload(); }

// ---------------- DOWNLOADS ----------------

function openDownloads() {
  document.getElementById("downloadsPanel").style.display = "flex";
}

function closeDownloads() {
  document.getElementById("downloadsPanel").style.display = "none";
}

ipcRenderer.on("download-progress", (e, data) => {
  let d = downloads.find(x => x.name === data.name);

  if (!d) {
    d = { name: data.name, received: 0, total: 1 };
    downloads.push(d);
  }

  d.received = data.received;
  d.total = data.total;

  renderDownloads();
});

ipcRenderer.on("download-done", (e, data) => {
  downloads.push({
    name: data.name,
    path: data.path,
    done: true
  });

  renderDownloads();
});

function renderDownloads() {
  const list = document.getElementById("downloadList");
  list.innerHTML = "";

  downloads.forEach(d => {
    const div = document.createElement("div");
    div.className = "downloadItem";

    if (d.done) {
      div.innerHTML = `
         ${d.name}<br>
         Completed<br>
        <button onclick="openFile('${d.path}')">Open</button>
      `;
    } else {
      const percent = Math.floor((d.received / d.total) * 100);
      div.innerHTML = `
        ⬇ ${d.name}<br>
        ${percent}% downloading...
      `;
    }

    list.appendChild(div);
  });
}

function openFile(path) {
  shell.openPath(path);
}

// ---------------- START ----------------

newTab();