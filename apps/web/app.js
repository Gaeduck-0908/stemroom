const t = (key) => window.i18n.t(key);
const stems = [
  { id: "vocals", color: "#77b7ef", volume: 82 }, { id: "drums", color: "#e8a56a", volume: 78 },
  { id: "bass", color: "#8cbf86", volume: 76 }, { id: "guitar", color: "#c391d4", volume: 74 },
  { id: "piano", color: "#e18891", volume: 73 }, { id: "other", color: "#d6c775", volume: 70 }
];
const $ = (selector) => document.querySelector(selector);
const els = {
  file: $("#audio-file"), uploadZone: $("#upload-zone"), uploadTitle: $("#upload-title"), uploadSubtitle: $("#upload-subtitle"), sourceDetails: $("#source-details"), fileType: $("#file-type"), fileName: $("#file-name"), fileSize: $("#file-size"), clear: $("#clear-file"),
  separate: $("#separate-button"), processingBox: $("#processing-box"), processingLabel: $("#processing-label"), processingPercent: $("#processing-percent"), progress: $("#progress-fill"), processingNote: $("#processing-note"),
  empty: $("#empty-workspace"), mix: $("#mix-workspace"), sessionTitle: $("#session-title"), stemList: $("#stem-list"), previewBadge: $("#preview-badge"), play: $("#play-button"), playhead: $("#playhead"), elapsed: $("#elapsed"), duration: $("#duration"), master: $("#master-volume"), downloadAll: $("#download-all"), mixNote: $("#mix-note"),
  status: $("#service-status"), statusDot: $(".status-dot"), settings: $("#settings-dialog"), settingsButton: $("#settings-button"), apiUrl: $("#api-url"), saveSettings: $("#save-settings")
};
const state = {
  file: null, job: null, apiUrl: localStorage.getItem("stemroom-api-url") || "http://localhost:8000", playing: false, audioContext: null, tracks: {}, duration: 0, offset: 0, startedAt: 0, ticker: null,
  controls: Object.fromEntries(stems.map((stem) => [stem.id, { volume: stem.volume, muted: false, solo: false }]))
};
const api = (path) => `${state.apiUrl.replace(/\/$/, "")}${path}`;
const stemName = (id) => t(`stems.${id}`);
const formatBytes = (bytes) => `${new Intl.NumberFormat(window.i18n.getLocale() === "ko" ? "ko-KR" : "en-US", { maximumFractionDigits: 1 }).format(bytes / 1048576)} MB`;
const asTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const db = (value) => `${((value / 100) * 18 - 18).toFixed(1).replace("-0.0", "0.0")} dB`;

function refreshCopy() {
  if (!state.file) { els.uploadTitle.textContent = t("selectFile"); els.uploadSubtitle.textContent = t("selectHint"); els.sessionTitle.textContent = t("newSession"); }
  els.previewBadge.textContent = state.job?.ready ? t("ready") : t("preview");
  if (!state.job?.ready) els.mixNote.textContent = t("previewNote");
  setPlaying(state.playing); drawStems(); checkService();
}
function setFile(file) {
  state.file = file;
  if (!file) { els.sourceDetails.hidden = true; els.separate.disabled = true; refreshCopy(); return; }
  const ext = file.name.split(".").pop().toUpperCase();
  els.uploadTitle.textContent = t("replaceFile"); els.uploadSubtitle.textContent = t("replaceHint"); els.fileType.textContent = ext; els.fileName.textContent = file.name; els.fileSize.textContent = formatBytes(file.size);
  els.sourceDetails.hidden = false; els.separate.disabled = false; els.sessionTitle.textContent = file.name.replace(/\.[^.]+$/, "");
}
function drawStems() {
  const template = $("#stem-template"); els.stemList.innerHTML = "";
  stems.forEach((stem) => {
    const item = template.content.cloneNode(true); const channel = item.querySelector(".stem-channel"); const control = state.controls[stem.id];
    channel.style.setProperty("--stem", stem.color); channel.dataset.stem = stem.id; item.querySelector(".stem-name strong").textContent = stemName(stem.id); item.querySelector(".stem-origin").textContent = t("sourceStem");
    const slider = item.querySelector('input[type="range"]'); const output = item.querySelector(".volume-output"); slider.value = control.volume; output.textContent = db(control.volume);
    slider.addEventListener("input", () => { control.volume = Number(slider.value); output.textContent = db(slider.value); applyMix(); });
    item.querySelector(".mute-button").addEventListener("click", (event) => toggleButton(event.currentTarget, channel, "muted"));
    item.querySelector(".solo-button").addEventListener("click", (event) => toggleButton(event.currentTarget, channel, "solo"));
    item.querySelectorAll(".format-button").forEach((button) => { button.disabled = !state.job?.ready; button.addEventListener("click", () => downloadStem(stem.id, button.textContent.toLowerCase())); });
    els.stemList.append(item);
  });
}
function toggleButton(button, channel, property) {
  const next = button.getAttribute("aria-pressed") !== "true"; button.setAttribute("aria-pressed", String(next)); state.controls[channel.dataset.stem][property] = next;
  if (property === "muted") channel.classList.toggle("is-muted", next);
  if (property === "solo") document.querySelectorAll(".stem-channel").forEach((item) => { if (item !== channel) item.classList.toggle("is-dimmed", next); });
  applyMix();
}
function showMixer(ready = false) {
  state.job = { ...(state.job || {}), ready }; els.empty.hidden = true; els.mix.hidden = false; els.previewBadge.textContent = ready ? t("ready") : t("preview"); els.downloadAll.disabled = !ready; els.mixNote.textContent = ready ? t("mixingReady") : t("previewNote"); drawStems();
}
function setProgress(percent, label, note) { els.processingBox.hidden = false; els.processingLabel.textContent = label; els.processingPercent.textContent = `${percent}%`; els.progress.style.width = `${percent}%`; els.processingNote.textContent = note; }
async function startSeparation() {
  if (!state.file) return; els.separate.disabled = true; setProgress(5, t("preparing"), t("preparingNote"));
  try { const body = new FormData(); body.append("file", state.file); const response = await fetch(api("/jobs"), { method: "POST", body }); if (!response.ok) throw new Error(t("connectionFailedNote")); const job = await response.json(); state.job = job; setProgress(13, t("queue"), t("queueNote")); pollJob(job.id); }
  catch { setProgress(0, t("connectionFailed"), t("connectionFailedNote")); els.separate.disabled = false; }
}
async function pollJob(id) {
  try { const response = await fetch(api(`/jobs/${id}`)); if (!response.ok) throw new Error(); const job = await response.json(); const serverCopy = window.i18n.getLocale() === "ko" ? (job.label || t("processing")) : t("processing"); setProgress(job.progress || 0, serverCopy, window.i18n.getLocale() === "ko" ? (job.message || t("processing")) : t("processing")); if (job.status === "ready") { state.job = { ...job, ready: true }; showMixer(true); return; } if (job.status === "failed") throw new Error(window.i18n.getLocale() === "ko" ? job.message : t("unknownError")); setTimeout(() => pollJob(id), 1700); }
  catch (error) { setProgress(0, t("interrupted"), error.message || t("unknownError")); els.separate.disabled = false; }
}
function downloadStem(stem, format) { const url = state.job?.downloads?.[stem]?.[format]; if (url) window.location.assign(api(url)); }
function setPlaying(playing) { state.playing = playing; $(".play-icon").hidden = playing; $(".pause-icon").hidden = !playing; els.play.setAttribute("aria-label", t(playing ? "pause" : "play")); }
function currentOffset() { return state.playing && state.audioContext ? Math.min(state.duration, state.audioContext.currentTime - state.startedAt) : state.offset; }
function renderTransport() { const offset = currentOffset(); els.playhead.value = state.duration ? (offset / state.duration) * 100 : 0; els.elapsed.textContent = asTime(offset); }
function applyMix() { const hasSolo = Object.values(state.controls).some((control) => control.solo); stems.forEach((stem) => { const track = state.tracks[stem.id]; if (!track?.gain) return; const control = state.controls[stem.id]; track.gain.gain.setTargetAtTime(control.muted || (hasSolo && !control.solo) ? 0 : (control.volume / 100) * (Number(els.master.value) / 100), state.audioContext.currentTime, .02); }); }
async function prepareMix() {
  if (Object.keys(state.tracks).length === stems.length) return; els.mixNote.textContent = t("mixingLoading"); state.audioContext ||= new AudioContext();
  const decoded = await Promise.all(stems.map(async (stem) => { const response = await fetch(api(state.job.downloads[stem.id].wav)); if (!response.ok) throw new Error(`${stemName(stem.id)}: ${t("unknownError")}`); return [stem.id, await state.audioContext.decodeAudioData(await response.arrayBuffer())]; }));
  decoded.forEach(([id, buffer]) => { state.tracks[id] = { buffer, source: null, gain: null }; }); state.duration = Math.max(...decoded.map(([, buffer]) => buffer.duration)); els.duration.textContent = asTime(state.duration); els.mixNote.textContent = t("mixingLive");
}
function stopSources() { Object.values(state.tracks).forEach((track) => { if (track.source) { track.source.onended = null; try { track.source.stop(); } catch {} track.source = null; } }); }
function startSources(offset) { stopSources(); state.startedAt = state.audioContext.currentTime - offset; Object.values(state.tracks).forEach((track) => { const source = state.audioContext.createBufferSource(); const gain = state.audioContext.createGain(); source.buffer = track.buffer; source.connect(gain).connect(state.audioContext.destination); track.source = source; track.gain = gain; source.start(0, offset); }); applyMix(); }
function beginTransportTimer() { clearInterval(state.ticker); state.ticker = setInterval(() => { renderTransport(); if (currentOffset() >= state.duration) { state.offset = 0; stopSources(); clearInterval(state.ticker); setPlaying(false); renderTransport(); } }, 120); }
async function toggleTransport() { if (!state.job?.ready) return; if (state.playing) { state.offset = currentOffset(); stopSources(); clearInterval(state.ticker); setPlaying(false); renderTransport(); return; } try { await prepareMix(); await state.audioContext.resume(); startSources(state.offset); setPlaying(true); beginTransportTimer(); } catch (error) { els.mixNote.textContent = error.message || t("unknownError"); } }
async function checkService() { try { const response = await fetch(api("/health")); if (!response.ok) throw new Error(); els.status.textContent = t("serviceOnline"); els.statusDot.className = "status-dot online"; } catch { els.status.textContent = t("serviceOffline"); els.statusDot.className = "status-dot offline"; } }
els.file.addEventListener("change", (event) => setFile(event.target.files[0])); els.clear.addEventListener("click", () => { els.file.value = ""; setFile(null); });
["dragenter", "dragover"].forEach((name) => els.uploadZone.addEventListener(name, (event) => { event.preventDefault(); els.uploadZone.classList.add("dragging"); })); ["dragleave", "drop"].forEach((name) => els.uploadZone.addEventListener(name, (event) => { event.preventDefault(); els.uploadZone.classList.remove("dragging"); })); els.uploadZone.addEventListener("drop", (event) => { const [file] = event.dataTransfer.files; if (file?.type.startsWith("audio/")) setFile(file); });
els.separate.addEventListener("click", startSeparation); els.downloadAll.addEventListener("click", () => { if (state.job?.zip_url) window.location.assign(api(state.job.zip_url)); }); els.play.addEventListener("click", toggleTransport); els.playhead.addEventListener("input", () => { if (!state.duration) return; state.offset = (Number(els.playhead.value) / 100) * state.duration; if (state.playing) startSources(state.offset); renderTransport(); }); els.master.addEventListener("input", applyMix); els.settingsButton.addEventListener("click", () => { els.apiUrl.value = state.apiUrl; els.settings.showModal(); }); els.saveSettings.addEventListener("click", () => { state.apiUrl = els.apiUrl.value.trim().replace(/\/$/, ""); localStorage.setItem("stemroom-api-url", state.apiUrl); checkService(); }); document.addEventListener("stemroom:language", refreshCopy);
refreshCopy();

