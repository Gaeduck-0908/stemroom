(() => {
  const copy = {
    en: {
      documentTitle: "Stemroom — Local stem separation",
      brandHome: "Stemroom home", serviceChecking: "Checking separation engine", serviceOnline: "Separation engine connected", serviceOffline: "Separation engine unavailable",
      settings: "Connection settings", newSession: "New session", headline: "Separate your track.", intro: "Upload one MP3 or WAV to create individual tracks for vocals, drums, bass, guitar, piano, and other instruments.",
      selectFile: "Choose an audio file", replaceFile: "Choose another file", selectHint: "MP3 · WAV · up to 500 MB", replaceHint: "Drop a file to replace it.", removeFile: "Remove selected file", start: "Start separation", privacy: "Your source and results are processed only on this computer.",
      workspace: "Workspace", preview: "Preview", ready: "Separation complete", waitingTitle: "Waiting for a source", waitingCopy: "Add a file on the left to listen to and control each individual stem here.",
      play: "Play preview", pause: "Pause preview", position: "Playback position", master: "Master volume", stemMixer: "Separated stems", sourceStem: "Separated from source", mute: "Mute", solo: "Solo", volume: "Volume", downloadAll: "Download all as ZIP", previewNote: "Preview session — downloads become available once separation is complete.",
      apiTitle: "Separation engine URL", apiCopy: "Save the address of your local FastAPI server. Leave it blank to use the current site.", apiLabel: "API URL", save: "Save", cancel: "Cancel", mixingReady: "Your results are ready. Choose a format to save each stem.", mixingLoading: "Loading and synchronizing all six stems…", mixingLive: "Adjust volume, mute, and solo while the stems play in sync.",
      preparing: "Preparing upload", preparingNote: "Sending the audio file securely to your local engine.", queue: "In separation queue", queueNote: "The engine is getting ready to analyze your track.", connectionFailed: "Could not connect", connectionFailedNote: "Check the engine URL in settings, then try again.", interrupted: "Separation interrupted", processing: "Separating stems", unknownError: "Something went wrong while separating the track.",
      stems: { vocals: "Vocals", drums: "Drums", bass: "Bass", guitar: "Guitar", piano: "Piano", other: "Other instruments" }
    },
    ko: {
      documentTitle: "Stemroom — 로컬 스템 분리", brandHome: "Stemroom 홈", serviceChecking: "분리 엔진 확인 중", serviceOnline: "분리 엔진 연결됨", serviceOffline: "분리 엔진 연결 안 됨",
      settings: "연결 설정", newSession: "새 세션", headline: "트랙을 분리하세요.", intro: "MP3 또는 WAV 한 곡을 업로드하면 보컬, 드럼, 베이스, 기타, 피아노, 기타 악기를 개별 트랙으로 만듭니다.",
      selectFile: "오디오 파일 선택", replaceFile: "다른 파일 선택", selectHint: "MP3 · WAV · 최대 500 MB", replaceHint: "파일을 끌어다 놓아 교체할 수 있습니다.", removeFile: "선택한 파일 제거", start: "스템 분리 시작", privacy: "원본 파일과 작업 결과는 이 컴퓨터 안에서만 처리됩니다.",
      workspace: "워크스페이스", preview: "미리보기", ready: "분리 완료", waitingTitle: "소스를 기다리는 중", waitingCopy: "왼쪽에서 파일을 추가하면 이곳에서 각각의 스템을 듣고 조절할 수 있습니다.",
      play: "미리듣기 재생", pause: "미리듣기 일시정지", position: "재생 위치", master: "마스터 볼륨", stemMixer: "분리된 스템", sourceStem: "원본에서 분리됨", mute: "뮤트", solo: "솔로", volume: "볼륨", downloadAll: "전체 ZIP 다운로드", previewNote: "미리보기 세션 — 분리 결과가 준비되면 다운로드가 활성화됩니다.",
      apiTitle: "분리 엔진 주소", apiCopy: "개인용 FastAPI 서버 주소를 저장합니다. 비어 있으면 현재 사이트와 같은 주소를 사용합니다.", apiLabel: "API 주소", save: "저장", cancel: "취소", mixingReady: "분리 결과가 준비되었습니다. 원하는 형식으로 저장하세요.", mixingLoading: "6개 스템을 불러와 동기화하고 있습니다…", mixingLive: "재생 중에도 각 스템의 볼륨, 뮤트, 솔로를 조절할 수 있습니다.",
      preparing: "업로드 준비", preparingNote: "오디오 파일을 안전하게 전송하고 있습니다.", queue: "분리 대기열", queueNote: "엔진이 곡을 분석할 준비를 하고 있습니다.", connectionFailed: "연결할 수 없음", connectionFailedNote: "엔진 주소를 확인한 뒤 다시 시도하세요.", interrupted: "분리 작업 중단", processing: "스템 분리", unknownError: "트랙을 분리하는 중 문제가 발생했습니다.",
      stems: { vocals: "보컬", drums: "드럼", bass: "베이스", guitar: "기타", piano: "피아노", other: "기타 악기" }
    }
  };
  let locale = localStorage.getItem("stemroom-language") || (navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en");
  const value = (key) => key.split(".").reduce((item, part) => item?.[part], copy[locale]) ?? key;
  function apply() {
    document.documentElement.lang = locale;
    document.title = value("documentTitle");
    document.querySelectorAll("[data-i18n]").forEach((element) => { element.innerHTML = value(element.dataset.i18n); });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => { element.setAttribute("aria-label", value(element.dataset.i18nAria)); });
    document.querySelectorAll("[data-language]").forEach((button) => { button.setAttribute("aria-pressed", String(button.dataset.language === locale)); });
    document.dispatchEvent(new CustomEvent("stemroom:language", { detail: { locale } }));
  }
  window.i18n = { t: value, getLocale: () => locale, setLocale: (next) => { locale = next === "ko" ? "ko" : "en"; localStorage.setItem("stemroom-language", locale); apply(); } };
  document.addEventListener("DOMContentLoaded", () => { apply(); document.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", () => window.i18n.setLocale(button.dataset.language))); });
})();

