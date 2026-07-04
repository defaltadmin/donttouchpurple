# Opus Prayer Times Code Delivery (Phases 2-4)

**Platform:** ClickUp AI Brain (GitHub MCP connected)
**Repo:** `defaltadmin/world-prayer-times`
**File:** `index.html` (single-file app, ~3105 lines)

---

## What You Must Do

Read `index.html` in the repo via GitHub MCP. Then deliver ALL code blocks for phases 2-4 in strict apply order. Every output must be a complete, copy-pasteable code block. No suggestions. No "consider adding." Just code.

**Do NOT stop between phases. Generate ALL blocks in one response.**

---

## Existing Code Structure (for your reference)

- State globals: lines 1327-1342 (`let cities, cache, selStart, selDur, enrolled, lang, alarm`)
- `renderClassesRow()`: line 1767
- `renderAll()`: line 1816 — calls `renderClassesRow()` at line 1843
- `exportICal()`: line 2438
- Add City button markup: line 1030 (`#add-row`)
- Add City onclick: line 2643
- CSS variables: lines 39-71 (`:root` with `--sp-*`, `--fs-*`, `--accent`, etc.)
- Helpers: `localToUTC()`, `utcToLocal()`, `getOffsetHours()`, `getOffsetForDate()`, `fmtH()`, `pct()`, `cacheKey()`

---

## PHASE 2: Personal Tasks System

### Block 2.1: Task State + CRUD

Insert AFTER the existing state globals (after line ~1342, before the `sanitizeName` function).

```javascript
/* ── Personal Tasks ─────────────────────────────────────────────── */
const WP_TASKS_KEY = 'wp_tasks_v1';
const TASK_COLORS = ['#34d399','#60a5fa','#f472b6','#fbbf24','#a78bfa'];
let userOffsetH = 0; // will be set from userCity or Intl

function loadTasks() {
    try { return JSON.parse(localStorage.getItem(WP_TASKS_KEY)) || []; }
    catch { return []; }
}
function saveTasks(tasks) { localStorage.setItem(WP_TASKS_KEY, JSON.stringify(tasks)); }

function addTask(task) {
    const tasks = loadTasks();
    task.id = crypto.randomUUID();
    task.createdAt = Date.now();
    tasks.push(task);
    saveTasks(tasks);
    return task;
}

function updateTask(id, patch) {
    const tasks = loadTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) { Object.assign(tasks[idx], patch); saveTasks(tasks); }
}

function deleteTask(id) {
    const tasks = loadTasks().filter(t => t.id !== id);
    saveTasks(tasks);
}

function timeToH(timeStr) {
    // "14:30" → 14.5 (local time)
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m || 0) / 60;
}
```

### Block 2.2: renderTasksRow()

Insert AFTER `renderClassesRow()` (after line ~1811, before `renderAll`).

```javascript
function renderTasksRow() {
    const tasks = loadTasks();
    if (!tasks.length) return null;
    const now = new Date();
    const userTz = userCity?.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayDow = new Intl.DateTimeFormat('en-US', { timeZone: userTz, weekday: 'short' }).format(now);
    const dayMap = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
    const todayNum = dayMap[todayDow];

    const todayTasks = tasks.filter(t => {
        if (t.recurrence === 'daily') return true;
        if (t.recurrence === 'weekly') return t.days?.includes(todayNum);
        // one-off: check if it's today
        const tDate = new Date(t.createdAt);
        return tDate.toDateString() === now.toDateString();
    });
    if (!todayTasks.length) return null;

    const row = document.createElement('div');
    row.className = 'city-row tasks-row';

    const lbl = document.createElement('div');
    lbl.className = 'city-label';
    lbl.innerHTML = `<span class="city-name" style="color:var(--safe);">${lang==='ar'?'مهامي':'My Tasks'}</span><span class="city-clock">${todayTasks.length} ${lang==='ar'?'اليوم':'today'}</span>`;
    row.appendChild(lbl);

    const strip = document.createElement('div');
    strip.style.cssText = 'flex:1;position:relative;background:var(--surface);';

    const userOff = getOffsetHours(userTz);
    todayTasks.forEach(t => {
        const startH = t.startHour + (t.startMin || 0) / 60;
        const endH = startH + (t.durationMin || 30) / 60;
        const ev = document.createElement('div');
        ev.className = 'task-block';
        ev.style.left = pct(startH) + '%';
        ev.style.width = pct(endH > startH ? endH - startH : (24 - startH + endH)) + '%';
        ev.style.background = t.color || TASK_COLORS[0];
        ev.textContent = t.name;
        ev.title = `${t.name} — ${fmtH(startH)}–${fmtH(endH)}`;
        ev.dataset.taskId = t.id;
        strip.appendChild(ev);
    });

    row.appendChild(strip);
    return row;
}
```

### Block 2.3: Add "My Tasks" button to markup

In the HTML, find the add-city row (line ~1030):
```html
<div class="add-row" id="add-row" role="button" tabindex="0" aria-label="Add City">
```

INSERT AFTER the closing of that div (after the `</div>` that closes `#add-row`), a new tasks button:

```html
<div class="add-row" id="tasks-row-btn" role="button" tabindex="0" aria-label="Add Task" style="border-color:rgba(52,211,153,0.3);margin-top:6px;">
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--safe)" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
</div>
```

### Block 2.4: Task Modal HTML

Insert after the existing modals (after the Help modal, line ~1085):

```html
<!-- ══════════════ ADD/EDIT TASK MODAL ══════════════ -->
<div class="modal-bg" id="m-task">
    <div class="modal">
        <div class="modal-head">
            <span class="modal-title" id="task-modal-title">Add Task</span>
            <button class="modal-close" data-close="m-task"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
            <div class="fg"><label class="fl" for="task-name">Task name</label><input type="text" id="task-name" class="fi" placeholder="e.g. Team standup" maxlength="50" required></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div class="fg"><label class="fl" for="task-start">Start time</label><input type="time" id="task-start" class="fi" value="09:00" required></div>
                <div class="fg"><label class="fl" for="task-duration">Duration</label><select id="task-duration" class="fs"><option value="15">15 min</option><option value="30" selected>30 min</option><option value="45">45 min</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option></select></div>
            </div>
            <div class="fg"><label class="fl">Color</label><div id="task-colors" style="display:flex;gap:8px;margin-top:4px;"></div></div>
            <div class="fg"><label class="fl" for="task-recurrence">Repeat</label><select id="task-recurrence" class="fs"><option value="none">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div>
            <div id="task-days-wrap" style="display:none;"><label class="fl">On days</label><div id="task-days" style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;"></div></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;">
            <button class="btn btn-ghost" data-close="m-task" style="flex:1;">Cancel</button>
            <button class="btn btn-accent" id="task-save-btn" style="flex:1;">Save Task</button>
        </div>
    </div>
</div>
```

### Block 2.5: Task Modal CSS

Add to the `<style>` block:

```css
/* ── Tasks ─────────────────────────────────────────── */
.tasks-row { background: transparent; }
.task-block {
    position: absolute; top: 18%; height: 64%; border-radius: 6px;
    font-size: 0.6rem; font-weight: 600; color: #fff;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    padding: 0 4px; cursor: pointer; transition: filter 0.2s;
    text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}
.task-block:hover { filter: brightness(1.2); }
.task-color-btn {
    width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent;
    cursor: pointer; transition: border-color 0.15s, transform 0.15s;
}
.task-color-btn:hover { transform: scale(1.1); }
.task-color-btn.selected { border-color: #fff; box-shadow: 0 0 0 2px var(--accent); }
.task-day-btn {
    padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border);
    background: transparent; color: var(--text); font-size: 0.7rem;
    cursor: pointer; transition: all 0.15s;
}
.task-day-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
#tasks-row-btn { transition: all 0.2s; }
#tasks-row-btn:hover { border-color: var(--safe); background: linear-gradient(180deg, rgba(52,211,153,0.06), transparent); }
```

### Block 2.6: Modal Wiring JS

Insert before the closing `</script>` or near the other event handlers:

```javascript
/* ── Task Modal Logic ────────────────────────────────────────────── */
(function() {
    let editingTaskId = null;
    let selectedColor = TASK_COLORS[0];

    function openTaskModal(taskId) {
        editingTaskId = taskId || null;
        const modal = $('#m-task');
        const title = $('#task-modal-title');
        const saveBtn = $('#task-save-btn');

        if (editingTaskId) {
            const task = loadTasks().find(t => t.id === editingTaskId);
            if (!task) return;
            title.textContent = 'Edit Task';
            saveBtn.textContent = 'Update';
            $('#task-name').value = task.name;
            $('#task-start').value = String(task.startHour).padStart(2,'0') + ':' + String(task.startMin||0).padStart(2,'0');
            $('#task-duration').value = task.durationMin;
            $('#task-recurrence').value = task.recurrence;
            selectedColor = task.color || TASK_COLORS[0];
        } else {
            title.textContent = 'Add Task';
            saveBtn.textContent = 'Save Task';
            $('#task-name').value = '';
            $('#task-start').value = '09:00';
            $('#task-duration').value = '30';
            $('#task-recurrence').value = 'none';
            selectedColor = TASK_COLORS[0];
        }

        // Render color buttons
        const colorsEl = $('#task-colors');
        colorsEl.innerHTML = '';
        TASK_COLORS.forEach(c => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'task-color-btn' + (c === selectedColor ? ' selected' : '');
            btn.style.background = c;
            btn.onclick = () => { selectedColor = c; colorsEl.querySelectorAll('.task-color-btn').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); };
            colorsEl.appendChild(btn);
        });

        // Render day buttons
        const daysWrap = $('#task-days-wrap');
        const daysEl = $('#task-days');
        const updateDaysVisibility = () => { daysWrap.style.display = $('#task-recurrence').value === 'weekly' ? 'block' : 'none'; };
        updateDaysVisibility();
        $('#task-recurrence').onchange = updateDaysVisibility;

        if ($('#task-recurrence').value === 'weekly') {
            const existing = editingTaskId ? (loadTasks().find(t => t.id === editingTaskId)?.days || []) : [];
            daysEl.innerHTML = '';
            ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach((d, i) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'task-day-btn' + (existing.includes(i) ? ' active' : '');
                btn.textContent = d;
                btn.onclick = () => btn.classList.toggle('active');
                daysEl.appendChild(btn);
            });
        }

        openM('#m-task');
    }

    // Wire up save button
    $('#task-save-btn')?.addEventListener('click', () => {
        const name = $('#task-name').value.trim();
        if (!name) return;
        const [h, m] = $('#task-start').value.split(':').map(Number);
        const durationMin = parseInt($('#task-duration').value);
        const recurrence = $('#task-recurrence').value;
        let days = [];
        if (recurrence === 'weekly') {
            days = [...$('#task-days').querySelectorAll('.task-day-btn.active')].map((_, i) => i);
            // Map visual order to actual day indices
            const dayOrder = [0,1,2,3,4,5,6]; // Sun-Sat
            days = [...$('#task-days').querySelectorAll('.task-day-btn')].map((btn, i) => btn.classList.contains('active') ? dayOrder[i] : -1).filter(i => i >= 0);
        }

        const data = { name, startHour: h, startMin: m || 0, durationMin, color: selectedColor, recurrence, days };

        if (editingTaskId) {
            updateTask(editingTaskId, data);
        } else {
            addTask(data);
        }

        closeM('#m-task');
        renderAll();
    });

    // Wire up add task button
    $('#tasks-row-btn')?.addEventListener('click', () => openTaskModal());
    $('#tasks-row-btn')?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTaskModal(); } });

    // Task context menu (right-click / long-press)
    document.addEventListener('click', e => {
        const taskBlock = e.target.closest('.task-block');
        if (!taskBlock) return;
        const taskId = taskBlock.dataset.taskId;
        if (!taskId) return;

        const existing = loadTasks().find(t => t.id === taskId);
        if (!existing) return;

        // Simple confirm for delete
        if (confirm(`Delete "${existing.name}"?`)) {
            deleteTask(taskId);
            renderAll();
        }
    });

    // Double-click to edit
    document.addEventListener('dblclick', e => {
        const taskBlock = e.target.closest('.task-block');
        if (taskBlock?.dataset.taskId) openTaskModal(taskBlock.dataset.taskId);
    });
})();
```

### Block 2.7: Add renderTasksRow() to renderAll()

In `renderAll()`, find the line that says:
```javascript
    const classesRow = renderClassesRow();
    if (classesRow) c.appendChild(classesRow);
```

AFTER those two lines, ADD:
```javascript
    // Tasks row (personal tasks)
    const tasksRow = renderTasksRow();
    if (tasksRow) c.appendChild(tasksRow);
```

---

## PHASE 3: iCal Export Fix

### Block 3.1: Replace exportICal() entirely

Replace the ENTIRE `exportICal()` function (lines 2438-2502) with this complete rewrite:

```javascript
function exportICal() {
    const now = new Date();
    const userTz = userCity?.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // ── VTIMEZONE definitions ──
    const VTIMEZONES = {
        'Asia/Riyadh':      'AST:Riyadh,+03,-0',
        'Europe/London':    'GMT/London:GMT0BST,M3.5.0/1,M10.5.0',
        'America/New_York': 'EST5EDT:New_York,M3.2.0/2,M11.1.0/2',
        'Asia/Kolkata':     'IST:Kolkata,+0530,-0530',
        'Asia/Dubai':       'GST:Dubai,+04,-0',
        'Asia/Jakarta':     'WIB:Jakarta,+07,-0',
        'Asia/Kuala_Lumpur':'MYT:Kuala_Lumpur,+08,-0',
        'Asia/Tokyo':       'JST:Tokyo,+09,-0',
    };

    function getVtimezone(tz) {
        const def = VTIMEZONES[tz];
        if (!def) return null;
        const [name, rules] = def.split(':');
        return [
            'BEGIN:VTIMEZONE',
            `TZID:${tz}`,
            `X-LIC-LOCATION:${tz}`,
            `BEGIN:STANDARD`,
            `DTSTART:19700101T000000`,
            `TZOFFSETFROM:${rules.split(',')[1] || '+0000'}`,
            `TZOFFSETTO:${rules.split(',')[1] || '+0000'}`,
            `TZNAME:${name}`,
            `END:STANDARD`,
            'END:VTIMEZONE'
        ];
    }

    const esc = s => String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
    const fold = l => l.replace(/(.{72})/g, '$1\r\n ');
    const pad = n => String(n).padStart(2, '0');
    const fmt = (h, m) => `${pad(Math.floor(h))}${pad(Math.round((h%1)*60))}00`;
    const localDate = () => {
        const p = new Intl.DateTimeFormat('en-CA', { timeZone: userTz, year:'numeric', month:'2-digit', day:'2-digit' }).format(now);
        return p.replace(/-/g, '');
    };
    const stamp = () => now.toISOString().replace(/[-:]/g,'').slice(0,15) + 'Z';

    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Prayer Times//EN', 'CALSCALE:GREGOR'];

    // Add VTIMEZONE for user's timezone
    const tzLines = getVtimezone(userTz);
    if (tzLines) lines.push(...tzLines);

    // Add VTIMEZONE for London (classes)
    const londonTz = getVtimezone('Europe/London');
    if (londonTz) lines.push(...londonTz);

    const today = localDate();

    // ── Prayer times (daily recurring) ──
    const PRAYER_NAMES = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
    const prayerNamesAr = { Fajr:'الفجر', Dhuhr:'الظهر', Asr:'العصر', Maghrib:'المغرب', Isha:'العشاء' };

    cities.forEach(city => {
        const ck = `${city.lat.toFixed(1)},${city.lng.toFixed(1)},${dateKey.key}`;
        const pd = cache[ck];
        if (!pd) return;
        const cityTz = city.tz || userTz;

        PRAYER_NAMES.forEach(name => {
            const val = pd.loc?.[name];
            if (!val) return;
            const [h, m] = val.split(':').map(Number);
            const startH = h + (m || 0) / 60;
            const endH = startH + 0.5; // 30min window
            const dtstart = `${today}T${pad(h)}${pad(m || 0)}00`;
            const endMins = Math.round(endH % 1 * 60);
            const endHr = Math.floor(endH);
            const dtend = `${today}T${pad(endHr)}${pad(endMins)}00`;

            lines.push(
                'BEGIN:VEVENT',
                `DTSTAMP:${stamp()}`,
                `SUMMARY:${name} (${city.name})`,
                `DTSTART;TZID=${cityTz}:${dtstart}`,
                `DTEND;TZID=${cityTz}:${dtend}`,
                `RRULE:FREQ=DAILY`,
                `DESCRIPTION:${esc('Prayer time for ' + city.name)}`,
                `UID:${city.id}-${name.toLowerCase()}-${today}@prayer.mscarabia.com`,
                'END:VEVENT'
            );
        });
    });

    // ── Enrolled classes (weekly recurring) ──
    if (enrolled.length) {
        const dayMapCal = ['SU','MO','TU','WE','TH','FR','SA'];
        enrolled.forEach(cls => {
            const computed = compCls(cls);
            if (!computed.ts) return;
            const [sh, sm] = cls.start.split(':').map(Number);
            const [eh, em] = cls.end.split(':').map(Number);
            const dtstart = `${today}T${pad(sh)}${pad(sm)}00`;
            const dtend = `${today}T${pad(eh)}${pad(em)}00`;

            lines.push(
                'BEGIN:VEVENT',
                `DTSTAMP:${stamp()}`,
                `SUMMARY:${esc(cls.subject + ' (' + cls.teacher + ')')}`,
                `DTSTART;TZID=Europe/London:${dtstart}`,
                `DTEND;TZID=Europe/London:${dtend}`,
                `RRULE:FREQ=WEEKLY;BYDAY=${dayMapCal[cls.day]}`,
                `DESCRIPTION:${esc('Sannatayn class with ' + cls.teacher)}`,
                `UID:${cls.day}-${cls.start.replace(':','')}-${cls.subject}@prayer.mscarabia.com`,
                'END:VEVENT'
            );
        });
    }

    // ── Personal tasks ──
    const tasks = loadTasks();
    tasks.forEach(t => {
        const h = t.startHour, m = t.startMin || 0;
        const endTotalMin = h * 60 + m + (t.durationMin || 30);
        const endH = Math.floor(endTotalMin / 60) % 24;
        const endM = endTotalMin % 60;
        const dtstart = `${today}T${pad(h)}${pad(m)}00`;
        const dtend = `${today}T${pad(endH)}${pad(endM)}00`;

        let rrule = '';
        if (t.recurrence === 'daily') rrule = 'RRULE:FREQ=DAILY';
        if (t.recurrence === 'weekly' && t.days?.length) {
            const dayAbbr = ['SU','MO','TU','WE','TH','FR','SA'];
            rrule = `RRULE:FREQ=WEEKLY;BYDAY=${t.days.map(d => dayAbbr[d]).join(',')}`;
        }

        lines.push(
            'BEGIN:VEVENT',
            `DTSTAMP:${stamp()}`,
            `SUMMARY:${esc(t.name)}`,
            `DTSTART;TZID=${userTz}:${dtstart}`,
            `DTEND;TZID=${userTz}:${dtend}`,
            ...(rrule ? [rrule] : []),
            `DESCRIPTION:${esc('Personal task')}`,
            `UID:${t.id}@prayer.mscarabia.com`,
            'END:VEVENT'
        );
    });

    // ── Selected safe meeting window ──
    const startH = Math.floor(selStart), startM = Math.round((selStart % 1) * 60);
    const endH = Math.floor(selStart + selDur), endM = Math.round(((selStart + selDur) % 1) * 60);
    const meetStart = `${today}T${pad(startH)}${pad(startM)}00`;
    const meetEnd = `${today}T${pad(endH)}${pad(endM)}00`;
    lines.push(
        'BEGIN:VEVENT',
        `DTSTAMP:${stamp()}`,
        'SUMMARY:Safe Meeting Window',
        `DTSTART;TZID=${userTz}:${meetStart}`,
        `DTEND;TZID=${userTz}:${meetEnd}`,
        `DESCRIPTION:${esc('No Salah conflict: ' + cities.map(c => c.name).join(', '))}`,
        `UID:meeting-${today}@prayer.mscarabia.com`,
        'END:VEVENT'
    );

    lines.push('END:VCALENDAR');
    const ics = lines.map(fold).join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prayer-sannatayn-${today}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

---

## PHASE 4: Notification System

### Block 4.1: Notification Scheduling JS

Insert near the existing notification code (~line 2380 area, look for `Notification`):

```javascript
/* ── Prayer Notifications ───────────────────────────────────────── */
let _notifPermission = 'default';
let _notifTimers = [];

function requestNotifPermission() {
    if (!('Notification' in window)) return;
    _notifPermission = Notification.permission;
    if (_notifPermission === 'default') {
        Notification.requestPermission().then(p => { _notifPermission = p; });
    }
}

function cancelAllNotifications() {
    _notifTimers.forEach(id => clearTimeout(id));
    _notifTimers = [];
}

function scheduleNotifications() {
    cancelAllNotifications();
    if (_notifPermission !== 'granted') return;

    const userTz = userCity?.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();

    cities.forEach(city => {
        const ck = `${city.lat.toFixed(1)},${city.lng.toFixed(1)},${dateKey.key}`;
        const pd = cache[ck];
        if (!pd) return;

        ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(name => {
            const val = pd.loc?.[name];
            if (!val) return;
            const [h, m] = val.split(':').map(Number);
            const prayerMs = new Date(now);
            prayerMs.setHours(h, m, 0, 0);

            // Schedule 5 minutes before
            const notifyMs = prayerMs - 5 * 60 * 1000;
            const delay = notifyMs - now.getTime();

            if (delay > 0 && delay < 12 * 3600 * 1000) { // only schedule within 12h
                const timerId = setTimeout(() => {
                    if (Notification.permission === 'granted') {
                        const nameAr = {Fajr:'الفجر',Dhuhr:'الظهر',Asr:'العصر',Maghrib:'المغرب',Isha:'العشاء'};
                        new Notification(`${name} prayer in 5 minutes`, {
                            body: `${city.name} — ${val} local time`,
                            icon: '/favicon.svg',
                            tag: `prayer-${name}-${city.id}`,
                            renotify: true,
                        });
                    }
                }, delay);
                _notifTimers.push(timerId);
            }
        });
    });
}

// Notification toggle UI
function renderNotifToggle() {
    const container = $('#notif-toggle-wrap');
    if (!container) return;
    if (!('Notification' in window)) { container.innerHTML = '<span style="font-size:0.72rem;color:var(--muted);">Notifications not supported</span>'; return; }

    const enabled = Notification.permission === 'granted';
    container.innerHTML = `
        <button class="btn btn-ghost" id="notif-toggle" style="display:flex;align-items:center;gap:6px;font-size:0.75rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            ${enabled ? 'Notifications ON' : 'Enable notifications'}
        </button>`;
    $('#notif-toggle')?.addEventListener('click', async () => {
        if (enabled) { cancelAllNotifications(); renderNotifToggle(); return; }
        await Notification.requestPermission();
        renderNotifToggle();
        if (Notification.permission === 'granted') { scheduleNotifications(); }
    });
}
```

### Block 4.2: Add notification toggle to settings modal

In the Settings modal HTML (line ~1046), find the last `setting-row` before the "How to Use" button. INSERT AFTER it:

```html
<div class="setting-row">
    <span class="setting-label">Prayer Notifications</span>
    <div id="notif-toggle-wrap"></div>
</div>
```

### Block 4.3: Add renderNotifToggle() call to init

In the init code (look for where `updateUI()` or `renderAll()` is called at the bottom), add after `renderAll()`:

```javascript
requestNotifPermission();
renderNotifToggle();
```

### Block 4.4: Add CSS for notification toggle

Add to `<style>`:

```css
#notif-toggle-wrap .btn { font-family: var(--font-body); }
```

---

## Rules

1. Apply these blocks in order: 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 → 3.1 → 4.1 → 4.2 → 4.3 → 4.4
2. Each block is independent — copy-paste the code into the exact location described
3. Do NOT modify any existing functions except `exportICal()` (Phase 3) and `renderAll()` (Block 2.7)
4. The code must work with the existing helpers: `localToUTC`, `utcToLocal`, `getOffsetHours`, `getOffsetForDate`, `fmtH`, `pct`, `cacheKey`, `openM`, `closeM`, `$`, `$$`
5. Test: after applying all blocks, the page should load without errors, tasks should persist, iCal should import correctly into Outlook/Google Calendar
