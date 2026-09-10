// ===== CALENDAR AVAILABILITY VIEW =====

async function loadAllUnavailability() {
    try {
        const response = await fetchFunction(`/.netlify/functions/get-unavailability?calendarId=${calendarData.id}`);
        const data = await response.json();

        // Transform from participant-based to date-based structure
        // Backend returns: { "participantName": { dates: [...], submittedAt: "..." }, ... }
        // We need: { "2026-06-15": ["person1", "person2"], ... }
        const rawUnavailability = data.unavailability || {};
        allUnavailability = {};

        Object.entries(rawUnavailability).forEach(([participant, info]) => {
            // Handle both old format (array) and new format (object with dates property)
            const dates = Array.isArray(info) ? info : (info.dates || []);
            dates.forEach(date => {
                if (!allUnavailability[date]) {
                    allUnavailability[date] = [];
                }
                if (!allUnavailability[date].includes(participant)) {
                    allUnavailability[date].push(participant);
                }
            });
        });

        renderAvailabilityCalendar();
    } catch (error) {
        console.error('Failed to load unavailability:', error);
        allUnavailability = {};
        renderAvailabilityCalendar();
    }
}

function renderAvailabilityCalendar() {
    const container = document.getElementById('availability-calendar');
    const startDate = new Date(calendarData.startDate + 'T00:00:00');
    const endDate = new Date(calendarData.endDate + 'T00:00:00');

    // Group dates by month
    const months = [];
    let current = new Date(startDate);
    current.setDate(1);

    while (current <= endDate) {
        months.push({
            year: current.getFullYear(),
            month: current.getMonth()
        });
        current.setMonth(current.getMonth() + 1);
    }

    container.innerHTML = months.map(({ year, month }) => {
        const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return `
            <div class="month-calendar">
                <h2>${monthName}</h2>
                <div class="calendar-grid" id="month-${year}-${month}"></div>
            </div>
        `;
    }).join('');

    months.forEach(({ year, month }) => {
        renderMonth(document.getElementById(`month-${year}-${month}`), year, month, startDate, endDate);
    });
}

function renderMonth(container, year, month, rangeStart, rangeEnd) {
    // Use local date construction to get correct day of week
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    const totalPeople = calendarData.participantsType === 'defined'
        ? calendarData.participants?.length || 1
        : Object.keys(getAllParticipants()).length || 1;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = days.map(d => `<div class="calendar-header">${d}</div>`).join('');

    // Add empty cells for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Normalize range dates for comparison (strip time component)
    const rangeStartNorm = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
    const rangeEndNorm = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());

    // Render ALL days in the month, but mark out-of-range dates as disabled
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // Create date object in local timezone for comparison
        const dateObj = new Date(year, month, day);

        // Check if date is in range
        const isInRange = dateObj >= rangeStartNorm && dateObj <= rangeEndNorm;

        if (!isInRange) {
            // Show the date but make it greyed out and disabled
            html += `
                <div class="calendar-day out-of-range" title="Outside event date range">
                    <span class="day-number">${day}</span>
                </div>
            `;
            continue;
        }

        const unavailablePeople = allUnavailability[dateStr] || [];
        const unavailableCount = unavailablePeople.length;

        const grayness = Math.min(unavailableCount / totalPeople, 1);
        const color = getAvailabilityColor(grayness);
        const textColor = grayness > 0.5 ? '#fff' : '#333';

        html += `
            <div class="calendar-day"
                 style="background: ${color}; color: ${textColor};"
                 data-date="${dateStr}"
                 title="${unavailableCount} unavailable">
                <span class="day-number">${day}</span>
                ${unavailableCount > 0 ? `<span class="unavailable-count">${unavailableCount}</span>` : ''}
            </div>
        `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.calendar-day:not(.empty)').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
            showDateDetails(dayEl.dataset.date);
        });
    });
}

function getAllParticipants() {
    const participants = {};
    // allUnavailability is now: { "2026-06-15": ["person1", "person2"], ... }
    Object.values(allUnavailability).forEach(peopleArray => {
        if (Array.isArray(peopleArray)) {
            peopleArray.forEach(p => {
                participants[p] = true;
            });
        }
    });
    return participants;
}

function getAvailabilityColor(grayness) {
    if (grayness === 0) {
        return '#4ade80';
    }

    const green = { r: 74, g: 222, b: 128 };
    const gray = { r: 26, g: 26, b: 26 };

    const r = Math.round(green.r + (gray.r - green.r) * grayness);
    const g = Math.round(green.g + (gray.g - green.g) * grayness);
    const b = Math.round(green.b + (gray.b - green.b) * grayness);

    return `rgb(${r}, ${g}, ${b})`;
}

function showDateDetails(dateStr) {
    const unavailablePeople = allUnavailability[dateStr] || [];
    const date = new Date(dateStr + 'T12:00:00');
    const dateDisplay = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    let content = `<h4>${dateDisplay}</h4>`;

    if (unavailablePeople.length === 0) {
        content += '<p class="available-message">🎉 Everyone is available on this date!</p>';
    } else {
        const allParticipants = calendarData.participantsType === 'defined'
            ? calendarData.participants
            : Object.keys(getAllParticipants());

        const availablePeople = allParticipants.filter(p => !unavailablePeople.includes(p));

        content += `
            <p><strong>${unavailablePeople.length} unavailable:</strong></p>
            <ul class="unavailable-list">
                ${unavailablePeople.map(p => `<li>❌ ${escapeHtml(p)}</li>`).join('')}
            </ul>
        `;

        if (availablePeople.length > 0) {
            content += `
                <p style="margin-top: 1rem;"><strong>${availablePeople.length} available:</strong></p>
                <p style="color: var(--success-color);">✅ ${availablePeople.map(escapeHtml).join(', ')}</p>
            `;
        }
    }

    const detailsEl = document.getElementById('date-details');
    document.getElementById('date-details-content').innerHTML = content;
    detailsEl.classList.remove('hidden');
    detailsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
