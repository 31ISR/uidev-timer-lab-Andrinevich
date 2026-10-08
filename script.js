// --- Получение элементов DOM ---
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");

const hoursCircle = document.getElementById("hours-circle");
const minutesCircle = document.getElementById("minutes-circle");
const secondsCircle = document.getElementById("seconds-circle");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const lapBtn = document.getElementById("lapBtn");
const resetBtn = document.getElementById("resetBtn");

const lapsContainer = document.getElementById("lapsContainer");
const lapList = document.getElementById("lapList");

// --- Константы и переменные состояния ---
const circumference = 2 * Math.PI * 52;
let elapsedTime = 0;   // Общее время в секундах
let timer = null;      // ID интервала
let isRunning = false; // Флаг работы таймера
let lapCount = 0;      // Счетчик кругов

// --- Вспомогательные функции ---

// Форматирует секунды в строку "HH:MM:SS"
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Возвращает объект с часами, минутами и секундами
function getTimeParts(totalSeconds) {
    return {
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
    };
}

// Обновляет прогресс на SVG-круге
function updateCircleProgress(circle, value, max) {
    const progress = (value / max) * circumference;
    circle.style.strokeDasharray = `${progress} ${circumference}`;
}

// --- Основная логика обновления интерфейса ---
function updateDisplay() {
    const { hours, minutes, seconds } = getTimeParts(elapsedTime);

    // Обновляем текст
    hoursEl.textContent = hours.toString().padStart(2, '0');
    minutesEl.textContent = minutes.toString().padStart(2, '0');
    secondsEl.textContent = seconds.toString().padStart(2, '0');

    // Обновляем круги
    updateCircleProgress(hoursCircle, hours, 24);
    updateCircleProgress(minutesCircle, minutes, 60);
    updateCircleProgress(secondsCircle, seconds, 60);
}

// --- Обработчики кнопок ---
function start() {
    if (isRunning) return;

    isRunning = true;
    timer = setInterval(() => {
        elapsedTime++;
        updateDisplay();
    }, 1000);

    // Управление состоянием кнопок
    startBtn.disabled = true;
    stopBtn.disabled = false;
    lapBtn.disabled = false;
}

function stop() {
    if (!isRunning) return;

    clearInterval(timer);
    timer = null;
    isRunning = false;

    // Управление состоянием кнопок
    startBtn.disabled = false;
    stopBtn.disabled = true;
    lapBtn.disabled = true;
}

function recordLap() {
    if (!isRunning) return;

    lapCount++;
    const currentTime = formatTime(elapsedTime);

    const lapItem = document.createElement("div");
    lapItem.className = "lap-item";
    lapItem.innerHTML = `
        <span class="lap-number">Lap ${lapCount}</span>
        <span class="lap-time">${currentTime}</span>
    `;

    // Вставляем новый круг в начало списка
    lapList.insertBefore(lapItem, lapList.firstChild);
    lapsContainer.style.display = "block";
}

function reset() {
    // Останавливаем таймер, если он запущен
    if (isRunning) {
        stop();
    }

    elapsedTime = 0;
    lapCount = 0;

    updateDisplay();

    // Очищаем список кругов
    lapList.innerHTML = "";
    lapsContainer.style.display = "none";

    // Управление состоянием кнопок (согласно таблице: активны Start и Reset)
    startBtn.disabled = false;
    stopBtn.disabled = true;
    lapBtn.disabled = true;
}

// --- Назначение событий ---
startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
lapBtn.addEventListener("click", recordLap);
resetBtn.addEventListener("click", reset);

// --- Инициализация страницы ---
// Устанавливаем начальное состояние интерфейса
updateDisplay();
startBtn.disabled = false;
stopBtn.disabled = true;
lapBtn.disabled = true;
resetBtn.disabled = false;
lapsContainer.style.display = "none";