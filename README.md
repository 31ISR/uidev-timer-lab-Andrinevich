# Таймер (секундомер с круговым прогрессом)

## Срок сдачи работ

Последний коммит и пул реквест должен быть оформлен до ???

## Цель

Научиться использовать JavaScript для работы со временем, `setInterval` и управлением состоянием интерфейса (кнопки, DOM-элементы).

Ваша задача — дописать сайт: `index.html` и `styles.css` уже готовы, нужно написать `script.js`.

## Что должно получиться

1. Кнопка **Start** запускает секундомер. Каждую секунду обновляются три круга: часы, минуты, секунды.
2. Кнопка **Stop** ставит секундомер на паузу. Повторный **Start** продолжает с того же места.
3. Кнопка **Lap** записывает текущее время в список кругов (новые записи сверху).
4. Кнопка **Reset** останавливает секундомер, обнуляет цифры и круги, очищает и прячет список кругов.
5. Кнопки блокируются и разблокируются в зависимости от состояния (см. таблицу ниже).

| Состояние      | Start    | Stop     | Lap      | Reset    |
| -------------- | -------- | -------- | -------- | -------- |
| Остановлен     | активна  | disabled | disabled | активна  |
| Идёт отсчёт    | disabled | активна  | активна  | активна  |

---

## Теория

### setInterval и clearInterval

**setInterval** — метод JavaScript, который выполняет функцию через равные промежутки времени. Он возвращает числовой ID, по которому интервал можно остановить через **clearInterval**.

```JavaScript
let count = 0;
let timer = setInterval(() => {
    count++;
    console.log(`Прошло секунд: ${count}`);

    // Автоматическая остановка на 10 секундах
    if (count >= 10) {
        clearInterval(timer);
    }
}, 1000);
```

-   `1000` — задержка в миллисекундах (1000 мс = 1 секунда)
-   `timer` — ID интервала. **Его нужно хранить в переменной**, иначе вы не сможете остановить таймер

> ⚠️ Если вызвать `setInterval` дважды, не остановив первый, будут работать два таймера сразу, и секундомер пойдёт в два раза быстрее. Поэтому в начале «Start» стоит проверять, что таймер ещё не запущен.

### Превращение секунд в часы, минуты и секунды

Если у нас есть общее количество секунд `count`, то:

-   часы = целая часть от `count / 3600`
-   минуты = целая часть от `(count % 3600) / 60`
-   секунды = остаток от `count / 60`, то есть `count % 60`

Пример: `count = 3725` → `3725 / 3600 = 1` час, `(3725 % 3600) / 60 = 2` минуты, `3725 % 60 = 5` секунд → `01:02:05`.

```JavaScript
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}
```

-   `padStart(2, '0')` дополняет строку нулями слева до длины 2: `"5"` → `"05"`
-   Функция возвращает строку, поэтому её можно использовать и для кругов, и для списка Lap

Чтобы отдельно получить часы, минуты и секунды (для трёх кругов), можно вынести расчёт в отдельную функцию, которая возвращает объект:

```JavaScript
function getTimeParts(totalSeconds) {
    return {
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
    };
}
```

### Изменение прогресса круга

Каждый круг — это SVG-окружность с радиусом `r = 52`. Длина окружности:

```
C = 2 · π · r = 2 · 3.14159 · 52 ≈ 326.7
```

Именно поэтому в HTML написано `stroke-dasharray="0 327"`.

Свойство `stroke-dasharray="A B"` рисует обводку «кусками»: `A` — длина закрашенного участка, `B` — длина пропуска. Если сделать `A = часть от длины окружности`, а `B = вся длина окружности`, то мы получим закрашенную дугу нужной длины.

```JavaScript
const circumference = 2 * Math.PI * 52;

function updateCircleProgress(circle, value, max) {
    const progress = (value / max) * circumference;
    circle.style.strokeDasharray = `${progress} ${circumference}`;
}

updateCircleProgress(hoursCircle, hours, 24);
```

-   `circle` — HTML-элемент круга определённой единицы времени
-   `value` — сколько сейчас часов/минут/секунд
-   `max` — максимальное значение: **24** для часов, **60** для минут и секунд

Примеры: 30 секунд из 60 → `(30 / 60) * 326.7 = 163.4` → закрашена половина круга. 15 минут из 60 → четверть круга.

### Создание записи круга (Lap)

```JavaScript
function recordLap() {
    if (isRunning) {
        lapCount++;
        const currentTime = formatTime(elapsedTime);

        const lapItem = document.createElement("div");
        lapItem.className = "lap-item";
        lapItem.innerHTML = `
            <span class="lap-number">Lap ${lapCount}</span>
            <span class="lap-time">${currentTime}</span>
        `;

        lapList.insertBefore(lapItem, lapList.firstChild);
        lapsContainer.style.display = "block";
    }
}
```

-   `document.createElement("div")` создаёт новый элемент в памяти
-   `innerHTML` задаёт его содержимое шаблонной строкой
-   `insertBefore(lapItem, lapList.firstChild)` вставляет запись **в начало** списка
-   `lapsContainer.style.display = "block"` показывает контейнер, который в HTML изначально скрыт

### Включение и отключение кнопок

У кнопки есть свойство `disabled`:

```JavaScript
startBtn.disabled = true;   // кнопку нельзя нажать
stopBtn.disabled = false;   // кнопку можно нажать
```

---

## Порядок выполнения

### Шаг 0. Подготовка HTML

В конце `index.html` оборван код. Перед закрывающим `</body>` подключите скрипт и закройте документ:

```html
    <script src="script.js"></script>
</body>
</html>
```

Создайте файл `script.js` рядом с `index.html`. Откройте страницу в браузере и держите открытой консоль (F12 → Console) — туда будут выводиться ошибки.

### Шаг 1. Получите элементы страницы

Используйте `document.getElementById`. Все нужные `id` уже есть в HTML:

```JavaScript
// Текст внутри кругов
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");

// Сами круги (SVG)
const hoursCircle = document.getElementById("hours-circle");
const minutesCircle = document.getElementById("minutes-circle");
const secondsCircle = document.getElementById("seconds-circle");

// Кнопки
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const lapBtn = document.getElementById("lapBtn");
const resetBtn = document.getElementById("resetBtn");

// Список кругов
const lapsContainer = document.getElementById("lapsContainer");
const lapList = document.getElementById("lapList");
```

### Шаг 2. Объявите переменные состояния

```JavaScript
const circumference = 2 * Math.PI * 52;

let elapsedTime = 0;   // сколько секунд прошло
let timer = null;      // ID интервала (null — таймер не запущен)
let isRunning = false; // идёт ли отсчёт
let lapCount = 0;      // сколько кругов записано
```

### Шаг 3. Напишите вспомогательные функции

Перенесите из теории и проверьте в консоли, что работают:

1. `formatTime(totalSeconds)` — возвращает строку `"HH:MM:SS"`. Проверка: `formatTime(3725)` должно вернуть `"01:02:05"`.
2. `updateCircleProgress(circle, value, max)`.

### Шаг 4. Напишите функцию `updateDisplay()`

Она берёт `elapsedTime` и обновляет весь интерфейс. Вызывайте её **каждый раз**, когда время изменилось (каждую секунду и при сбросе).

```JavaScript
function updateDisplay() {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    // TODO 1: записать в hoursEl, minutesEl, secondsEl значения
    //         с ведущими нулями (используйте padStart)

    // TODO 2: вызвать updateCircleProgress для каждого из трёх кругов
    //         (max для часов — 24, для минут и секунд — 60)
}
```

### Шаг 5. Напишите функцию `start()`

```JavaScript
function start() {
    if (isRunning) return; // защита от двойного запуска

    // TODO 1: поставить isRunning = true

    // TODO 2: запустить setInterval, который каждую секунду
    //         увеличивает elapsedTime на 1 и вызывает updateDisplay()
    //         Результат сохраните в переменную timer

    // TODO 3: сделать startBtn неактивной, а stopBtn и lapBtn — активными
}
```

### Шаг 6. Напишите функцию `stop()`

```JavaScript
function stop() {
    // TODO 1: остановить интервал через clearInterval(timer)
    // TODO 2: isRunning = false, timer = null
    // TODO 3: startBtn — активна, stopBtn и lapBtn — неактивны
}
```

`elapsedTime` здесь **не обнуляется**, поэтому после повторного Start отсчёт продолжится с того же места.

### Шаг 7. Напишите функцию `recordLap()`

Возьмите код из теории. Убедитесь, что новая запись появляется **сверху** и что блок со списком становится видимым.

### Шаг 8. Напишите функцию `reset()`

```JavaScript
function reset() {
    // TODO 1: остановить таймер (можно вызвать stop())
    // TODO 2: elapsedTime = 0, lapCount = 0
    // TODO 3: вызвать updateDisplay(), чтобы вернуть 00 и пустые круги
    // TODO 4: очистить lapList (lapList.innerHTML = "")
    // TODO 5: спрятать lapsContainer (style.display = "none")
}
```

### Шаг 9. Подключите обработчики событий

```JavaScript
startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
lapBtn.addEventListener("click", recordLap);
resetBtn.addEventListener("click", reset);
```

Передавайте функцию **без скобок** (`start`, а не `start()`), иначе она выполнится сразу при загрузке страницы, а не при клике.

---

## Как проверить себя

-   [ ] После нажатия Start секунды идут раз в секунду, круг секунд заполняется
-   [ ] На 60-й секунде секунды сбрасываются в `00`, минуты становятся `01`
-   [ ] Числа всегда двузначные: `05`, а не `5`
-   [ ] Stop останавливает отсчёт, повторный Start продолжает с того же места
-   [ ] Повторное нажатие Start не ускоряет секундомер
-   [ ] Lap добавляет записи сверху: `Lap 3`, `Lap 2`, `Lap 1`
-   [ ] Reset обнуляет цифры, круги и убирает список кругов
-   [ ] Кнопки блокируются по таблице из начала задания
-   [ ] В консоли браузера нет ошибок

**Совет для отладки:** чтобы не ждать минуту, временно задайте `elapsedTime = 3590` и проверьте переход на следующую минуту и час.

## Частые ошибки

-   **Забыли подключить `script.js`** — ничего не происходит, в консоли пусто
-   **`getElementById("startbtn")`** — `id` чувствительны к регистру, берите их точно из HTML
-   **Не сохранили результат `setInterval`** — потом нечем вызвать `clearInterval`
-   **`start()` в `addEventListener`** вместо `start`
-   **Деление без `Math.floor`** — получаются дробные значения вроде `1.0347`
-   **Забыли `updateDisplay()` в `reset()`** — внутри остаётся старое время
-   **Круг заполняется неверно** — проверьте `max` (24 для часов, 60 для минут и секунд) и значение `circumference`

## Задание повышенной сложности (необязательно)

`setInterval` не гарантирует точность: при нагруженной вкладке секундомер может отставать. Попробуйте считать время не через `elapsedTime++`, а через разницу `Date.now()`:

1. При старте запомните `startTimestamp = Date.now() - elapsedTime * 1000`
2. В интервале считайте `elapsedTime = Math.floor((Date.now() - startTimestamp) / 1000)`

Подумайте, почему так точнее, и для чего вычитается `elapsedTime * 1000`.

## Как сдавать

1. Создайте форк репозитория в организации `31ISR` с названием `uidev-timer-lab`
2. Используя ветку `wip`, сделайте задание
3. Зафиксируйте изменения в вашем репозитории (`git add`, `git commit`, `git push`) и захостите работу
4. Когда работа готова, создайте пул реквест из ветки `wip` (вашей) на ветку `main` (тоже вашу) и укажите меня ([ktkv419](https://github.com/ktkv419)) как reviewer

**Не мержите коммит сами**, это сделаю я после проверки задания.
