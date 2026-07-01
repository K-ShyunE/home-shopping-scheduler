import Litepicker from "litepicker";
import "./style.css";

const defaults = {
  channels: [
    { name: "GS SHOP", alias: "GS" },
    { name: "CJ온스타일", alias: "CJ" },
    { name: "현대홈쇼핑", alias: "현대" },
    { name: "롯데홈쇼핑", alias: "롯데" },
    { name: "NS홈쇼핑", alias: "NS" },
  ],
  vendors: [
    { name: "기본 업체", alias: "" },
    { name: "샘플 협력사", alias: "" },
    { name: "테스트 브랜드", alias: "" },
  ],
  spreadsheet: {
    mode: "new",
    id: "",
    title: "홈쇼핑 방송 일정",
    folderID: "root",
    folderTitle: "내 드라이브",
  },
  calendar: {
    mode: "new",
    id: "",
    title: "홈쇼핑 방송 일정",
  },
};

const storageKey = "home-shopping-scheduler-settings";

const elements = {
  dateInput: document.querySelector("#dateInput"),
  timeInput: document.querySelector("#timeInput"),
  clearTime: document.querySelector("#clearTime"),
  prevDate: document.querySelector("#prevDate"),
  nextDate: document.querySelector("#nextDate"),
  channelSelect: document.querySelector("#channelSelect"),
  vendorSelect: document.querySelector("#vendorSelect"),
  productInput: document.querySelector("#productInput"),
  quantityInput: document.querySelector("#quantityInput"),
  summaryText: document.querySelector("#summaryText"),
  result: document.querySelector("#result"),
  resetButton: document.querySelector("#resetButton"),
  submitButton: document.querySelector("#submitButton"),
  connectionLabel: document.querySelector("#connectionLabel"),
  connectionTitle: document.querySelector("#connectionTitle"),
  connectionText: document.querySelector("#connectionText"),
  connectGoogle: document.querySelector("#connectGoogle"),
  checkConnection: document.querySelector("#checkConnection"),
  spreadsheetTitle: document.querySelector("#spreadsheetTitle"),
  calendarTitle: document.querySelector("#calendarTitle"),
  destinationToggle: document.querySelector("#destinationToggle"),
  destinationPanel: document.querySelector("#destinationPanel"),
  destinationClose: document.querySelector("#destinationClose"),
  spreadsheetModeNew: document.querySelector("#spreadsheetModeNew"),
  spreadsheetModeExisting: document.querySelector("#spreadsheetModeExisting"),
  spreadsheetNameInput: document.querySelector("#spreadsheetNameInput"),
  spreadsheetFolderSelect: document.querySelector("#spreadsheetFolderSelect"),
  spreadsheetSelect: document.querySelector("#spreadsheetSelect"),
  calendarModeNew: document.querySelector("#calendarModeNew"),
  calendarModeExisting: document.querySelector("#calendarModeExisting"),
  calendarNameInput: document.querySelector("#calendarNameInput"),
  calendarSelect: document.querySelector("#calendarSelect"),
  saveDestination: document.querySelector("#saveDestination"),
  settingsToggle: document.querySelector("#settingsToggle"),
  settingsPanel: document.querySelector("#settingsPanel"),
  settingsClose: document.querySelector("#settingsClose"),
  channelsEditor: document.querySelector("#channelsEditor"),
  vendorsEditor: document.querySelector("#vendorsEditor"),
  addChannel: document.querySelector("#addChannel"),
  addVendor: document.querySelector("#addVendor"),
  saveSettings: document.querySelector("#saveSettings"),
  toast: document.querySelector("#toast"),
};

let settings = loadSettings();
let googleStatus = {
  configured: false,
  connected: false,
  email: "",
  message: "앱에서 실행하면 Google 계정을 연결할 수 있습니다.",
};
let destinationOptions = {
  folders: [],
  spreadsheets: [],
  calendars: [],
};
let spreadsheetFolder = {
  id: settings.spreadsheet.folderID || "root",
  title: settings.spreadsheet.folderTitle || "내 드라이브",
};
let destinationDraft = null;
let settingsDraft = null;
let selectedDateValue = toDateValue(new Date());
let datePicker = null;
let toastTimer = null;

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    const loaded = {
      ...defaults,
      ...saved,
      spreadsheet: { ...defaults.spreadsheet, ...saved?.spreadsheet },
      calendar: { ...defaults.calendar, ...saved?.calendar },
    };
    return normalizeSettings(loaded);
  } catch {
    return normalizeSettings({ ...defaults });
  }
}

function saveSettings() {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}

function normalizeSettings(value) {
  return {
    ...value,
    channels: normalizeNamedItems(value.channels, defaults.channels),
    vendors: normalizeNamedItems(value.vendors, defaults.vendors),
  };
}

function normalizeNamedItems(items, fallback) {
  const source = Array.isArray(items) ? items : fallback;
  const normalized = source
    .map((item) => {
      if (typeof item === "string") {
        return { name: item.trim(), alias: "" };
      }

      return {
        name: String(item?.name || "").trim(),
        alias: String(item?.alias || "").trim(),
      };
    })
    .filter((item) => item.name);

  return normalized.length > 0
    ? normalized
    : fallback.map((item) => ({ ...item }));
}

function toDateValue(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatKoreanDate(value) {
  const [year, month, day] = value.split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function onlyTimeDigits(value) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function formatPartialTime(value) {
  const digits = onlyTimeDigits(value);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function normalizeTimeInput(value) {
  const digits = onlyTimeDigits(value);
  if (!digits) {
    return "";
  }

  let hour = "";
  let minute = "";
  if (digits.length <= 2) {
    hour = digits;
    minute = "00";
  } else if (digits.length === 3) {
    hour = digits.slice(0, 1);
    minute = digits.slice(1);
  } else {
    hour = digits.slice(0, 2);
    minute = digits.slice(2);
  }

  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  if (hourNumber > 23 || minuteNumber > 59) {
    return null;
  }

  return `${String(hourNumber).padStart(2, "0")}:${String(minuteNumber).padStart(2, "0")}`;
}

function setSelectedDate(value, syncPicker = true) {
  selectedDateValue = value;
  elements.dateInput.value = formatKoreanDate(value);

  if (syncPicker && datePicker) {
    datePicker.setDate(value);
  }

  updateSummary();
}

function renderOptions(select, items) {
  select.innerHTML = "";
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = item.name;
    select.append(option);
  });
}

function renderSettings() {
  const source = settingsDraft || settings;
  renderListEditor(elements.channelsEditor, source.channels, "channel");
  renderListEditor(elements.vendorsEditor, source.vendors, "vendor");
}

function renderListEditor(container, items, type) {
  container.innerHTML = "";
  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "list-editor-row";
    row.dataset.type = type;
    row.dataset.index = String(index);

    const orderControls = document.createElement("div");
    orderControls.className = "order-controls";

    const upButton = createListButton("↑", "위로 이동", "move-up", index === 0);
    const downButton = createListButton("↓", "아래로 이동", "move-down", index === items.length - 1);
    orderControls.append(upButton, downButton);

    const nameInput = document.createElement("input");
    nameInput.className = "list-name-input";
    nameInput.type = "text";
    nameInput.autocomplete = "off";
    nameInput.value = item.name;
    nameInput.placeholder = "풀네임";

    const aliasInput = document.createElement("input");
    aliasInput.className = "list-alias-input";
    aliasInput.type = "text";
    aliasInput.autocomplete = "off";
    aliasInput.value = item.alias;
    aliasInput.placeholder = item.name || "비우면 풀네임";

    const deleteButton = createListButton("×", "삭제", "delete-row", items.length <= 1);
    row.append(orderControls, nameInput, aliasInput, deleteButton);
    container.append(row);
  });
}

function createListButton(text, title, action, disabled = false) {
  const button = document.createElement("button");
  button.className = "list-icon-button";
  button.type = "button";
  button.textContent = text;
  button.title = title;
  button.dataset.action = action;
  button.disabled = disabled;
  return button;
}

function renderFormOptions() {
  renderOptions(elements.channelSelect, settings.channels);
  renderOptions(elements.vendorSelect, settings.vendors);
}

function renderDestinationSummary() {
  elements.spreadsheetTitle.textContent = settings.spreadsheet.title || "미설정";
  elements.calendarTitle.textContent = settings.calendar.title || "미설정";
}

function createDestinationDraft() {
  return {
    spreadsheet: { ...settings.spreadsheet },
    calendar: { ...settings.calendar },
  };
}

function ensureDestinationDraft() {
  if (!destinationDraft) {
    destinationDraft = createDestinationDraft();
  }
  return destinationDraft;
}

function syncDestinationDraftFromPanel() {
  if (!destinationDraft || elements.destinationPanel.hidden) {
    return;
  }

  const selectedFolder = getSelectedSpreadsheetFolder();
  destinationDraft = {
    spreadsheet: {
      ...destinationDraft.spreadsheet,
      mode: selectedRadioValue("spreadsheetMode"),
      id: elements.spreadsheetSelect.value,
      title: elements.spreadsheetNameInput.value.trim() || destinationDraft.spreadsheet.title,
      folderID: selectedFolder.id,
      folderTitle: selectedFolder.title,
    },
    calendar: {
      ...destinationDraft.calendar,
      mode: selectedRadioValue("calendarMode"),
      id: elements.calendarSelect.value,
      title: elements.calendarNameInput.value.trim() || destinationDraft.calendar.title,
    },
  };
}

function renderDestinationPanel() {
  const draft = ensureDestinationDraft();
  const spreadsheetMode = draft.spreadsheet.mode || "new";
  const calendarMode = draft.calendar.mode || "new";
  elements.spreadsheetModeNew.checked = spreadsheetMode === "new";
  elements.spreadsheetModeExisting.checked = spreadsheetMode === "existing";
  elements.spreadsheetNameInput.value = draft.spreadsheet.title || defaults.spreadsheet.title;
  elements.calendarModeNew.checked = calendarMode === "new";
  elements.calendarModeExisting.checked = calendarMode === "existing";
  elements.calendarNameInput.value = draft.calendar.title || defaults.calendar.title;
  renderResourceOptions(
    elements.spreadsheetSelect,
    destinationOptions.spreadsheets,
    draft.spreadsheet.id,
    "선택 가능한 스프레드시트가 없습니다",
  );
  renderFolderOptions();
  renderResourceOptions(
    elements.calendarSelect,
    destinationOptions.calendars,
    draft.calendar.id,
    "선택 가능한 캘린더가 없습니다",
  );
  updateDestinationFields();
}

function renderResourceOptions(select, items, selectedID, placeholder) {
  select.innerHTML = "";
  if (items.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    select.append(option);
    return;
  }

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.title;
    select.append(option);
  });

  if (selectedID && items.some((item) => item.id === selectedID)) {
    select.value = selectedID;
  }
}

function renderFolderOptions() {
  elements.spreadsheetFolderSelect.innerHTML = "";
  const rootOption = document.createElement("option");
  rootOption.value = "root";
  rootOption.textContent = "내 드라이브";
  elements.spreadsheetFolderSelect.append(rootOption);

  if (spreadsheetFolder.id !== "root") {
    const currentOption = document.createElement("option");
    currentOption.value = spreadsheetFolder.id;
    currentOption.textContent = `현재 폴더: ${spreadsheetFolder.title}`;
    elements.spreadsheetFolderSelect.append(currentOption);
  }

  destinationOptions.folders.forEach((folder) => {
    const option = document.createElement("option");
    option.value = folder.id;
    option.textContent = `폴더: ${folder.title}`;
    elements.spreadsheetFolderSelect.append(option);
  });

  elements.spreadsheetFolderSelect.value = spreadsheetFolder.id;
}

function selectedRadioValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "new";
}

function updateDestinationFields() {
  const spreadsheetMode = selectedRadioValue("spreadsheetMode");
  const calendarMode = selectedRadioValue("calendarMode");
  elements.spreadsheetNameInput.disabled = spreadsheetMode !== "new";
  elements.spreadsheetFolderSelect.disabled = false;
  elements.spreadsheetSelect.disabled = spreadsheetMode !== "existing";
  elements.calendarNameInput.disabled = calendarMode !== "new";
  elements.calendarSelect.disabled = calendarMode !== "existing";
}

function renderConnection() {
  const connected = googleStatus.connected;
  const configured = googleStatus.configured;
  elements.connectionLabel.textContent = connected ? "연결됨" : "연결 필요";
  elements.connectionLabel.className = connected ? "status-pill connected" : "status-pill pending";
  elements.connectionTitle.textContent = connected
    ? "Google 계정이 연결되어 있습니다"
    : "Google 계정 연결이 필요합니다";
  elements.connectionText.textContent = connected
    ? `${googleStatus.email || "연결된 계정"}으로 시트와 캘린더에 등록됩니다.`
    : googleStatus.message || "방송 일정을 등록하려면 한 번만 Google 계정을 연결해 주세요.";
  elements.connectGoogle.textContent = connected ? "다시 연결" : "Google 계정 연결하기";
  elements.connectGoogle.disabled = !configured;
  elements.checkConnection.disabled = !configured;
}

function changeDate(days) {
  const date = new Date(`${selectedDateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  setSelectedDate(toDateValue(date));
}

function updateSummary() {
  const date = formatKoreanDate(selectedDateValue);
  const channel = elements.channelSelect.value;
  const vendor = elements.vendorSelect.value;
  const product = elements.productInput.value.trim();
  const quantity = elements.quantityInput.value.trim();
  const time = elements.timeInput.value.trim();
  const timeText = time ? `${time} · ` : "";

  if (!product) {
    elements.summaryText.textContent = `${date} ${timeText}${channel} 방송 일정을 입력하세요.`;
    return;
  }

  const quantityText = quantity ? ` / ${quantity}개` : "";
  elements.summaryText.textContent = `${date} · ${timeText}${channel} · ${vendor} · ${product}${quantityText}`;
}

function resetForm() {
  setSelectedDate(toDateValue(new Date()));
  elements.timeInput.value = "";
  elements.productInput.value = "";
  elements.quantityInput.value = "";
  elements.channelSelect.selectedIndex = 0;
  elements.vendorSelect.selectedIndex = 0;
  elements.productInput.focus();
  updateSummary();
  elements.result.value = "새 일정을 입력하세요.";
}

function showToast(message, tone = "success") {
  window.clearTimeout(toastTimer);
  elements.toast.className = `toast ${tone}`;
  elements.toast.innerHTML = "";
  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "✓";
  const text = document.createElement("span");
  text.textContent = message;
  elements.toast.append(icon, text);
  elements.toast.hidden = false;
  requestAnimationFrame(() => {
    elements.toast.classList.add("visible");
  });

  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
    window.setTimeout(() => {
      if (!elements.toast.classList.contains("visible")) {
        elements.toast.hidden = true;
      }
    }, 220);
  }, 2600);
}

if (import.meta.env.DEV) {
  window.previewToast = () => showToast("시트와 캘린더에 등록했습니다.");
}

function userErrorMessage(error, fallback) {
  const detail = error?.message || String(error || "").trim();
  if (!detail) {
    return fallback;
  }
  return `${fallback} 상세: ${detail}`;
}

function destinationReady() {
  return Boolean(settings.spreadsheet.title && settings.calendar.title);
}

function getPayload() {
  const channel = findNamedItem(settings.channels, elements.channelSelect.value);
  const vendor = findNamedItem(settings.vendors, elements.vendorSelect.value);

  return {
    date: selectedDateValue,
    time: elements.timeInput.value.trim(),
    channel: channel.name,
    vendor: vendor.name,
    calendarChannel: calendarLabel(channel),
    calendarVendor: calendarLabel(vendor),
    product: elements.productInput.value.trim(),
    quantity: elements.quantityInput.value.trim(),
    spreadsheet: settings.spreadsheet,
    calendar: settings.calendar,
  };
}

function findNamedItem(items, name) {
  return items.find((item) => item.name === name) || { name, alias: "" };
}

function calendarLabel(item) {
  return item.alias || item.name;
}

async function submitForm() {
  const payload = getPayload();

  if (!payload.product) {
    elements.result.value = "제품명을 입력해야 등록할 수 있습니다.";
    elements.productInput.focus();
    return;
  }

  const normalizedTime = normalizeTimeInput(payload.time);
  if (normalizedTime === null) {
    elements.result.value = "시간은 00:00부터 23:59 사이로 입력해 주세요.";
    elements.timeInput.focus();
    return;
  }
  payload.time = normalizedTime;
  elements.timeInput.value = normalizedTime;
  updateSummary();

  if (!googleStatus.connected) {
    elements.result.value = "Google 계정을 먼저 연결해야 등록할 수 있습니다.";
    return;
  }

  if (!destinationReady()) {
    elements.result.value = "등록 위치를 먼저 설정해야 등록할 수 있습니다.";
    return;
  }

  elements.submitButton.disabled = true;
  elements.result.value = "시트와 캘린더에 등록 중입니다.";

  try {
    const response = await callApp("SubmitSchedule", payload);
    if (!response.ok) {
      elements.result.value = response.message || "등록에 실패했습니다.";
      return;
    }

    settings = {
      ...settings,
      spreadsheet: {
        ...settings.spreadsheet,
        ...response.spreadsheet,
      },
      calendar: {
        ...settings.calendar,
        ...response.calendar,
      },
    };
    saveSettings();
    renderDestinationSummary();
    resetForm();
    showToast(response.message || "시트와 캘린더에 등록했습니다.");
  } catch (error) {
    elements.result.value = userErrorMessage(
      error,
      "앱 내부 호출 중 오류가 발생해 등록 결과를 확인하지 못했습니다. 같은 일정이 이미 등록됐을 수 있으니 시트와 캘린더를 확인한 뒤 다시 시도해 주세요.",
    );
  } finally {
    elements.submitButton.disabled = false;
  }
}

function handleTimeInput() {
  elements.timeInput.value = formatPartialTime(elements.timeInput.value);
  updateSummary();
}

function handleTimeBlur() {
  const normalized = normalizeTimeInput(elements.timeInput.value);
  if (normalized === null) {
    elements.result.value = "시간은 00:00부터 23:59 사이로 입력해 주세요.";
    elements.timeInput.focus();
    return;
  }
  elements.timeInput.value = normalized;
  updateSummary();
}

function clearTime() {
  elements.timeInput.value = "";
  updateSummary();
  elements.timeInput.focus();
}

function saveSettingsFromPanel() {
  const channels = readListEditor(elements.channelsEditor);
  const vendors = readListEditor(elements.vendorsEditor);

  settings = {
    ...settings,
    channels,
    vendors,
  };

  if (settings.channels.length === 0) {
    settings.channels = defaults.channels.map((item) => ({ ...item }));
  }

  if (settings.vendors.length === 0) {
    settings.vendors = defaults.vendors.map((item) => ({ ...item }));
  }

  saveSettings();
  settingsDraft = null;
  renderFormOptions();
  renderSettings();
  renderDestinationSummary();
  updateSummary();
  elements.result.value = "설정이 저장되었습니다.";
  elements.settingsPanel.hidden = true;
}

function readListEditor(container) {
  return Array.from(container.querySelectorAll(".list-editor-row"))
    .map((row) => ({
      name: row.querySelector(".list-name-input")?.value.trim() || "",
      alias: row.querySelector(".list-alias-input")?.value.trim() || "",
    }))
    .filter((item) => item.name);
}

function syncSettingsDraftFromEditors() {
  if (elements.settingsPanel.hidden) {
    return;
  }

  settingsDraft = {
    ...(settingsDraft || settings),
    channels: readListEditor(elements.channelsEditor),
    vendors: readListEditor(elements.vendorsEditor),
  };
}

function updateListEditor(type, updater) {
  syncSettingsDraftFromEditors();
  const key = type === "channel" ? "channels" : "vendors";
  const source = settingsDraft || settings;
  settingsDraft = {
    ...source,
    [key]: updater(source[key]),
  };
  renderSettings();
}

function addListItem(type) {
  updateListEditor(type, (items) => [
    ...items,
    { name: "", alias: "" },
  ]);

  const container = type === "channel" ? elements.channelsEditor : elements.vendorsEditor;
  container.querySelector(".list-editor-row:last-child .list-name-input")?.focus();
}

function moveListItem(type, index, direction) {
  updateListEditor(type, (items) => {
    const next = [...items];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= next.length) {
      return next;
    }

    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    return next;
  });
}

function deleteListItem(type, index) {
  updateListEditor(type, (items) => {
    if (items.length <= 1) {
      return items;
    }

    return items.filter((_, itemIndex) => itemIndex !== index);
  });
}

function handleListEditorClick(event) {
  const button = event.target.closest(".list-icon-button");
  if (!button) {
    return;
  }

  const row = button.closest(".list-editor-row");
  const type = row?.dataset.type;
  const index = Number(row?.dataset.index);
  if (!type || Number.isNaN(index)) {
    return;
  }

  if (button.dataset.action === "move-up") {
    moveListItem(type, index, -1);
  } else if (button.dataset.action === "move-down") {
    moveListItem(type, index, 1);
  } else if (button.dataset.action === "delete-row") {
    deleteListItem(type, index);
  }
}

function saveDestinationFromPanel() {
  syncDestinationDraftFromPanel();
  const spreadsheetMode = selectedRadioValue("spreadsheetMode");
  const calendarMode = selectedRadioValue("calendarMode");
  const selectedSpreadsheet = destinationOptions.spreadsheets.find((item) => item.id === elements.spreadsheetSelect.value);
  const selectedCalendar = destinationOptions.calendars.find((item) => item.id === elements.calendarSelect.value);
  const selectedFolder = getSelectedSpreadsheetFolder();
  const spreadsheetTitle = spreadsheetMode === "existing"
    ? selectedSpreadsheet?.title || ""
    : elements.spreadsheetNameInput.value.trim() || defaults.spreadsheet.title;
  const calendarTitle = calendarMode === "existing"
    ? selectedCalendar?.title || ""
    : elements.calendarNameInput.value.trim() || defaults.calendar.title;

  if (spreadsheetMode === "existing" && !selectedSpreadsheet) {
    elements.result.value = "기존 스프레드시트를 선택해 주세요.";
    return;
  }

  if (calendarMode === "existing" && !selectedCalendar) {
    elements.result.value = "기존 캘린더를 선택해 주세요.";
    return;
  }

  settings = {
    ...settings,
    spreadsheet: {
      ...settings.spreadsheet,
      mode: spreadsheetMode,
      id: spreadsheetMode === "existing" ? selectedSpreadsheet.id : "",
      title: spreadsheetTitle,
      folderID: selectedFolder.id,
      folderTitle: selectedFolder.title,
    },
    calendar: {
      ...settings.calendar,
      mode: calendarMode,
      id: calendarMode === "existing" ? selectedCalendar.id : "",
      title: calendarTitle,
    },
  };

  saveSettings();
  renderDestinationSummary();
  destinationDraft = null;
  elements.result.value = "등록 위치가 저장되었습니다.";
  elements.destinationPanel.hidden = true;
}

function getSelectedSpreadsheetFolder() {
  const selectedOption = elements.spreadsheetFolderSelect.selectedOptions[0];
  const folderID = elements.spreadsheetFolderSelect.value || "root";
  let folderTitle = selectedOption?.textContent || "내 드라이브";
  folderTitle = folderTitle.replace("현재 폴더: ", "").replace("폴더: ", "");

  return {
    id: folderID,
    title: folderID === "root" ? "내 드라이브" : folderTitle,
  };
}

async function callApp(methodName, ...args) {
  const app = window.go?.main?.App;
  if (!app?.[methodName]) {
    return {
      configured: false,
      connected: false,
      email: "",
      message: "브라우저 미리보기에서는 Google 연결을 실행할 수 없습니다.",
    };
  }

  return app[methodName](...args);
}

async function loadGoogleStatus() {
  try {
    googleStatus = await callApp("GetGoogleConnectionStatus");
  } catch (error) {
    googleStatus = {
      configured: false,
      connected: false,
      email: "",
      message: userErrorMessage(error, "Google 연결 상태를 확인하지 못했습니다."),
    };
  }
  renderConnection();
}

async function connectGoogle() {
  try {
    googleStatus = await callApp("StartGoogleConnect");
  } catch (error) {
    googleStatus = {
      configured: true,
      connected: false,
      email: "",
      message: userErrorMessage(error, "Google 계정 연결을 시작하지 못했습니다."),
    };
  }
  renderConnection();
  elements.result.value = googleStatus.message;
}

async function checkConnection() {
  await loadGoogleStatus();
  if (!googleStatus.connected) {
    elements.result.value = googleStatus.message || "아직 Google 계정이 연결되지 않았습니다.";
    return;
  }

  elements.result.value = "Google 계정 연결 상태가 정상입니다.";
}

async function loadDestinationOptions() {
  if (!googleStatus.connected) {
    destinationOptions = {
      folders: [],
      spreadsheets: [],
      calendars: [],
    };
    renderDestinationPanel();
    elements.result.value = "Google 계정을 먼저 연결해야 목록을 불러올 수 있습니다.";
    return;
  }

  elements.result.value = "등록 위치 목록을 불러오는 중입니다.";
  let response;
  try {
    response = await callApp("ListGoogleDestinations");
  } catch (error) {
    destinationOptions = {
      folders: [],
      spreadsheets: [],
      calendars: [],
    };
    renderDestinationPanel();
    elements.result.value = userErrorMessage(error, "등록 위치 목록을 불러오지 못했습니다.");
    return;
  }
  if (!response.ok) {
    destinationOptions = {
      folders: [],
      spreadsheets: [],
      calendars: [],
    };
    renderDestinationPanel();
    elements.result.value = response.message || "등록 위치 목록을 불러오지 못했습니다.";
    return;
  }

  destinationOptions = {
    folders: destinationOptions.folders,
    spreadsheets: response.spreadsheets || [],
    calendars: response.calendars || [],
  };
  renderDestinationPanel();
  elements.result.value = response.message;
}

async function loadSpreadsheetFolder(parentID = "root") {
  if (!googleStatus.connected) {
    destinationOptions = {
      ...destinationOptions,
      folders: [],
      spreadsheets: [],
    };
    renderDestinationPanel();
    return;
  }

  syncDestinationDraftFromPanel();
  let response;
  try {
    response = await callApp("ListGoogleDriveFolder", parentID);
  } catch (error) {
    destinationOptions = {
      ...destinationOptions,
      folders: [],
      spreadsheets: [],
    };
    renderDestinationPanel();
    elements.result.value = userErrorMessage(error, "Google Drive 폴더 내용을 불러오지 못했습니다.");
    return;
  }
  if (!response.ok) {
    destinationOptions = {
      ...destinationOptions,
      folders: [],
      spreadsheets: [],
    };
    renderDestinationPanel();
    elements.result.value = response.message || "Google Drive 폴더 내용을 불러오지 못했습니다.";
    return;
  }

  const selectedOption = Array.from(elements.spreadsheetFolderSelect.options)
    .find((option) => option.value === parentID);
  spreadsheetFolder = {
    id: response.parentID || parentID,
    title: parentID === "root"
      ? "내 드라이브"
      : selectedOption?.textContent?.replace("폴더: ", "") || spreadsheetFolder.title || "선택한 폴더",
  };
  destinationOptions = {
    ...destinationOptions,
    folders: response.folders || [],
    spreadsheets: response.spreadsheets || [],
  };
  renderDestinationPanel();
  elements.result.value = response.message;
}

function bindEvents() {
  elements.prevDate.addEventListener("click", () => changeDate(-1));
  elements.nextDate.addEventListener("click", () => changeDate(1));
  elements.timeInput.addEventListener("input", handleTimeInput);
  elements.timeInput.addEventListener("blur", handleTimeBlur);
  elements.timeInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      clearTime();
    }
  });
  elements.clearTime.addEventListener("click", clearTime);
  elements.resetButton.addEventListener("click", resetForm);
  elements.submitButton.addEventListener("click", submitForm);
  elements.connectGoogle.addEventListener("click", connectGoogle);
  elements.checkConnection.addEventListener("click", checkConnection);
  elements.saveSettings.addEventListener("click", saveSettingsFromPanel);
  elements.addChannel.addEventListener("click", () => addListItem("channel"));
  elements.addVendor.addEventListener("click", () => addListItem("vendor"));
  elements.channelsEditor.addEventListener("click", handleListEditorClick);
  elements.vendorsEditor.addEventListener("click", handleListEditorClick);
  elements.destinationToggle.addEventListener("click", async () => {
    elements.destinationPanel.hidden = false;
    elements.settingsPanel.hidden = true;
    destinationDraft = createDestinationDraft();
    renderDestinationPanel();
    await loadDestinationOptions();
    await loadSpreadsheetFolder(spreadsheetFolder.id);
  });
  elements.destinationClose.addEventListener("click", () => {
    destinationDraft = null;
    elements.destinationPanel.hidden = true;
  });
  elements.saveDestination.addEventListener("click", saveDestinationFromPanel);
  elements.spreadsheetFolderSelect.addEventListener("change", async () => {
    await loadSpreadsheetFolder(elements.spreadsheetFolderSelect.value);
  });
  [
    elements.spreadsheetModeNew,
    elements.spreadsheetModeExisting,
    elements.calendarModeNew,
    elements.calendarModeExisting,
  ].forEach((element) => {
    element.addEventListener("change", () => {
      syncDestinationDraftFromPanel();
      updateDestinationFields();
    });
  });

  elements.settingsToggle.addEventListener("click", () => {
    elements.settingsPanel.hidden = false;
    elements.destinationPanel.hidden = true;
    destinationDraft = null;
    settingsDraft = {
      ...settings,
      channels: settings.channels.map((item) => ({ ...item })),
      vendors: settings.vendors.map((item) => ({ ...item })),
    };
    renderSettings();
  });

  elements.settingsClose.addEventListener("click", () => {
    settingsDraft = null;
    elements.settingsPanel.hidden = true;
  });

  [
    elements.channelSelect,
    elements.vendorSelect,
    elements.productInput,
    elements.quantityInput,
    elements.timeInput,
  ].forEach((element) => {
    element.addEventListener("input", updateSummary);
    element.addEventListener("change", updateSummary);
  });
}

function setupDatePicker() {
  datePicker = new Litepicker({
    element: elements.dateInput,
    singleMode: true,
    lang: "ko-KR",
    format: "YYYY년 M월 D일",
    dropdowns: {
      minYear: 2020,
      maxYear: 2035,
      months: true,
      years: true,
    },
    buttonText: {
      previousMonth: "‹",
      nextMonth: "›",
      reset: "초기화",
      apply: "적용",
      cancel: "취소",
    },
    setup: (picker) => {
      picker.on("selected", (date) => {
        setSelectedDate(date.format("YYYY-MM-DD"), false);
      });
    },
  });
}

async function init() {
  renderFormOptions();
  renderSettings();
  renderDestinationSummary();
  bindEvents();
  setupDatePicker();
  setSelectedDate(selectedDateValue);
  await loadGoogleStatus();
  updateSummary();
}

init();
