// ===== CALENDAR PAGE =====
// This handles the shared calendar view where participants submit their unavailability

// State
let calendarData = null;
let selectedDates = [];
let userSubmittedDates = [];
let datePickerViewStart = null;
let isDatePickerInitialized = false;
let isDatePickerResizeBound = false;
let allUnavailability = {};
let submittedParticipants = [];
// Bumped per request so a slow earlier response can't overwrite a newer one.
let userSubmissionsRequestId = 0;
let allUnavailabilityRequestId = 0;
let currentParticipant = '';
let resolvedParticipantKey = '';
const DATE_PICKER_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Get calendar ID from URL
function getCalendarId() {
    const path = window.location.pathname;
    const match = path.match(/\/c\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Locales must be loaded before any synchronous t() call during render.
    await window.i18n.whenReady();

    // Ensure proper initial state
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const calendarContent = document.getElementById('calendar-content');

    if (loadingState) loadingState.classList.remove('hidden');
    if (errorState) errorState.classList.add('hidden');
    if (calendarContent) calendarContent.classList.add('hidden');

    const calendarId = getCalendarId();

    if (!calendarId) {
        showError();
        return;
    }

    await loadCalendar(calendarId);
});

// Load calendar data
async function loadCalendar(calendarId) {
    console.log('Loading calendar with ID:', calendarId);

    try {
        const response = await fetchFunction(`/.netlify/functions/get-calendar?id=${calendarId}`);
        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to load calendar:', response.status, errorText);
            showError(`Calendar not found (Status: ${response.status})`);
            return;
        }

        calendarData = await response.json();
        console.log('Calendar data loaded:', calendarData);

        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('error-state').classList.add('hidden');
        document.getElementById('calendar-content').classList.remove('hidden');

        try {
            renderCalendarInfo();
            console.log('renderCalendarInfo completed');
        } catch (e) {
            console.error('Error in renderCalendarInfo:', e);
        }

        try {
            setupParticipantInput();
            console.log('setupParticipantInput completed');
        } catch (e) {
            console.error('Error in setupParticipantInput:', e);
        }

        // Only initialize date picker now if it's a defined participants calendar
        // For open calendars, date picker is initialized after name entry
        try {
            if (calendarData.participantsType === 'defined' || calendarData.requireEmailVerification) {
                initDatePicker();
                console.log('initDatePicker completed');
            }
        } catch (e) {
            console.error('Error in initDatePicker:', e);
        }

        try {
            initTabs();
            console.log('initTabs completed');
        } catch (e) {
            console.error('Error in initTabs:', e);
        }

        try {
            initFormHandlers();
            console.log('initFormHandlers completed');
        } catch (e) {
            console.error('Error in initFormHandlers:', e);
        }

        try {
            await loadAllUnavailability();
            console.log('loadAllUnavailability completed');
        } catch (e) {
            console.error('Error in loadAllUnavailability:', e);
        }

    } catch (error) {
        console.error('Error loading calendar:', error);
        showError(error.message);
    }
}

function showError(message = '') {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const calendarContent = document.getElementById('calendar-content');

    if (loadingState) loadingState.classList.add('hidden');
    if (errorState) errorState.classList.remove('hidden');
    if (calendarContent) calendarContent.classList.add('hidden');

    // Optionally show detailed error in console
    if (message) {
        console.log('Calendar error:', message);
    }
}

function renderCalendarInfo() {
    document.getElementById('calendar-title').textContent = calendarData.name;

    if (calendarData.description) {
        document.getElementById('calendar-description').textContent = calendarData.description;
    }

    const startDate = formatDisplayDate(calendarData.startDate);
    const endDate = formatDisplayDate(calendarData.endDate);
    document.getElementById('date-range-display').textContent = `${startDate} - ${endDate}`;

    // Update page title
    document.title = `${calendarData.name} - NotThisDate`;

    // Update SEO meta tags dynamically
    updateSEOMetaTags();
}

// Update SEO meta tags with calendar-specific content
function updateSEOMetaTags() {
    const calendarName = calendarData.name || 'Group Event';
    const description = calendarData.description || 'Mark when you\'re NOT available so we can find the best dates for everyone!';
    const startDate = calendarData.startDate;
    const endDate = calendarData.endDate;
    const currentUrl = window.location.href;

    // Update title tags
    const pageTitle = `${calendarName} | NotThisDate - Group Availability Calendar`;
    document.title = pageTitle;
    updateMetaTag('name', 'title', pageTitle);

    // Update description
    const seoDescription = `${description} Select dates from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}. Free group scheduling tool.`;
    updateMetaTag('name', 'description', seoDescription);

    // Update canonical URL
    updateLinkTag('canonical', currentUrl);

    // Update Open Graph tags
    updateMetaTag('property', 'og:url', currentUrl);
    updateMetaTag('property', 'og:title', `Join: ${calendarName}`);
    updateMetaTag('property', 'og:description', description);

    // Update Twitter Card tags
    updateMetaTag('property', 'twitter:url', currentUrl);
    updateMetaTag('property', 'twitter:title', `Join: ${calendarName}`);
    updateMetaTag('property', 'twitter:description', description);

    // Update structured data
    updateStructuredData();
}

function updateMetaTag(attribute, attributeValue, content) {
    let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attributeValue);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
}

function updateLinkTag(rel, href) {
    let element = document.querySelector(`link[rel="${rel}"]`);
    if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
    }
    element.setAttribute('href', href);
}

function updateStructuredData() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": calendarData.name,
        "description": calendarData.description || "Group event availability coordination",
        "startDate": calendarData.startDate,
        "endDate": calendarData.endDate,
        "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "organizer": {
            "@type": "Organization",
            "name": "NotThisDate",
            "url": "https://reverse-date-picker.netlify.app/"
        }
    };

    if (calendarData.participants && calendarData.participants.length > 0) {
        structuredData.attendee = calendarData.participants.map(name => ({
            "@type": "Person",
            "name": name
        }));
    }

    let scriptTag = document.getElementById('calendar-structured-data');
    if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        scriptTag.id = 'calendar-structured-data';
        document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData, null, 2);
}

function setupParticipantInput() {
    const container = document.getElementById('participant-input-container');
    const verificationSection = document.getElementById('email-verification-section');
    const mainFormSection = document.getElementById('main-form-section');
    const nameEntryStep = document.getElementById('name-entry-step');
    const dateSelectionStep = document.getElementById('date-selection-step');

    if (calendarData.participantsType === 'defined' && calendarData.participants?.length > 0) {
        // Show dropdown for defined participants - skip name entry, go straight to date selection
        verificationSection?.classList.add('hidden');
        mainFormSection?.classList.remove('hidden');
        nameEntryStep?.classList.add('hidden');
        dateSelectionStep?.classList.remove('hidden');

        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'participant-select-wrapper';

        const select = document.createElement('select');
        select.id = 'participant-select';
        select.className = 'participant-select';
        select.innerHTML = `
            <option value="">${window.i18n.t('calendarSubmit.selectNamePlaceholder')}</option>
            ${calendarData.participants.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
        `;
        selectWrapper.appendChild(select);
        container.appendChild(selectWrapper);

        // Add helpful hint
        const hint = document.createElement('p');
        hint.className = 'form-hint';
        hint.textContent = window.i18n.t('calendarSubmit.selectNameHint');
        container.appendChild(hint);

        // Add change listener
        select.addEventListener('change', async (e) => {
            currentParticipant = e.target.value;
            updateSubmitButton();
            if (currentParticipant) {
                await loadUserSubmissions();
            }
        });
    } else if (calendarData.requireEmailVerification) {
        // Open calendar WITH email verification required
        verificationSection?.classList.remove('hidden');
        mainFormSection?.classList.add('hidden');

        // Check if user already verified (stored in sessionStorage)
        const verifiedUser = getVerifiedUser();
        if (verifiedUser) {
            // User already verified, show form directly
            showVerifiedForm(verifiedUser.name, verifiedUser.email);
        } else {
            // Setup verification handlers
            setupEmailVerification();
        }
    } else {
        // Open calendar WITHOUT email verification - show name entry step first
        verificationSection?.classList.add('hidden');
        mainFormSection?.classList.remove('hidden');
        nameEntryStep?.classList.remove('hidden');
        dateSelectionStep?.classList.add('hidden');

        // Setup name entry handlers
        setupNameEntry();
    }
}

// Name entry flow for open calendars without email verification
function setupNameEntry() {
    const nameInput = document.getElementById('participant-name-input');
    const confirmBtn = document.getElementById('confirm-name-btn');

    // Enable/disable confirm button based on input
    nameInput?.addEventListener('input', (e) => {
        const name = e.target.value.trim();
        confirmBtn.disabled = !name;
    });

    // Handle Enter key
    nameInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && nameInput.value.trim()) {
            confirmName();
        }
    });

    // Handle confirm button click
    confirmBtn?.addEventListener('click', confirmName);
}

async function confirmName() {
    const nameInput = document.getElementById('participant-name-input');
    const name = nameInput.value.trim();

    if (!name) return;

    currentParticipant = name;

    // Hide name entry, show date selection
    document.getElementById('name-entry-step')?.classList.add('hidden');
    document.getElementById('date-selection-step')?.classList.remove('hidden');

    // Show the confirmed name in the participant container
    const container = document.getElementById('participant-input-container');
    container.innerHTML = `
        <div class="confirmed-name-display">
            <span class="confirmed-name">${escapeHtml(name)}</span>
            <button type="button" class="change-name-btn" title="${window.i18n.t('calendarSubmit.verify.changeName')}">✎</button>
        </div>
    `;

    // Allow changing the name
    container.querySelector('.change-name-btn')?.addEventListener('click', () => {
        document.getElementById('name-entry-step')?.classList.remove('hidden');
        document.getElementById('date-selection-step')?.classList.add('hidden');
        document.getElementById('participant-name-input').value = currentParticipant;
        document.getElementById('participant-name-input').focus();
    });

    // Initialize the date picker now
    initDatePicker();

    // Update submit button and load previous submissions
    updateSubmitButton();
    await loadUserSubmissions();
}

// Email verification flow for open calendars
let verificationEmail = '';
let verificationName = '';
let verificationCode = '';

function setupEmailVerification() {
    const sendBtn = document.getElementById('send-verification-btn');
    const verifyBtn = document.getElementById('verify-code-btn');
    const resendBtn = document.getElementById('resend-code-btn');

    sendBtn?.addEventListener('click', sendVerificationCode);
    verifyBtn?.addEventListener('click', verifyCode);
    resendBtn?.addEventListener('click', sendVerificationCode);
}

async function sendVerificationCode() {
    const emailInput = document.getElementById('verification-email');
    const nameInput = document.getElementById('verification-name');
    const errorDiv = document.getElementById('verification-error');
    const sendBtn = document.getElementById('send-verification-btn');

    verificationEmail = emailInput.value.trim();
    verificationName = nameInput.value.trim();

    if (!verificationEmail || !verificationName) {
        showVerificationError(window.i18n.t('calendarSubmit.verify.errorMissingFields'));
        return;
    }

    if (!isValidEmail(verificationEmail)) {
        showVerificationError(window.i18n.t('calendarSubmit.verify.errorInvalidEmail'));
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = window.i18n.t('common.sending');
    errorDiv.classList.add('hidden');

    try {
        // Generate a simple verification code (in production, this would be sent via email)
        // For demo purposes, we'll use a simulated flow
        verificationCode = generateVerificationCode();

        // In production, you'd call an API to send the email:
        // await fetch('/.netlify/functions/send-verification', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email: verificationEmail, name: verificationName, calendarId: calendarData.id })
        // });

        // For now, simulate sending (show code in console for testing)
        console.log(`Verification code for ${verificationEmail}: ${verificationCode}`);

        // Show step 2
        document.getElementById('email-step-1').classList.add('hidden');
        document.getElementById('email-step-2').classList.remove('hidden');
        document.querySelector('.verification-sent-msg').innerHTML = window.i18n.t('calendarSubmit.verify.sentMsg', { email: `<strong>${escapeHtml(verificationEmail)}</strong>` });

        // Show a hint for demo purposes
        showVerificationError(window.i18n.t('calendarSubmit.verify.demoModeCode', { code: verificationCode }));
        errorDiv.classList.remove('error');
        errorDiv.style.color = 'var(--primary-color)';
        errorDiv.style.background = 'var(--primary-bg)';

    } catch (error) {
        showVerificationError(window.i18n.t('calendarSubmit.verify.errorSendFailed'));
    }

    sendBtn.disabled = false;
    sendBtn.textContent = window.i18n.t('calendarSubmit.verify.sendCode');
}

function verifyCode() {
    const codeInput = document.getElementById('verification-code');
    const enteredCode = codeInput.value.trim();
    const verifyBtn = document.getElementById('verify-code-btn');

    if (enteredCode === verificationCode) {
        // Success! Store verification and show form
        storeVerifiedUser(verificationName, verificationEmail);
        showVerifiedForm(verificationName, verificationEmail);
    } else {
        showVerificationError(window.i18n.t('calendarSubmit.verify.errorInvalidCode'));
        codeInput.value = '';
        codeInput.focus();
    }
}

async function showVerifiedForm(name, email) {
    const verificationSection = document.getElementById('email-verification-section');
    const mainFormSection = document.getElementById('main-form-section');
    const container = document.getElementById('participant-input-container');

    verificationSection?.classList.add('hidden');
    mainFormSection?.classList.remove('hidden');

    // Show verified user info
    container.innerHTML = `
        <div class="verified-user-info">
            <div class="verified-badge">
                <span class="verified-icon">✓</span>
                <span class="verified-name">${escapeHtml(name)}</span>
            </div>
            <p class="verified-email">${escapeHtml(email)}</p>
        </div>
    `;

    // Set current participant
    currentParticipant = name;
    updateSubmitButton();
    await loadUserSubmissions();
}

function showVerificationError(message) {
    const errorDiv = document.getElementById('verification-error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.style.color = '';
    errorDiv.style.background = '';
}

function storeVerifiedUser(name, email) {
    const key = `verified_${calendarData.id}`;
    sessionStorage.setItem(key, JSON.stringify({ name, email }));
}

function getVerifiedUser() {
    const key = `verified_${calendarData.id}`;
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
}

// Tab switching
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const tabId = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                content.classList.add('hidden');
            });
            const activeTab = document.getElementById(`${tabId}-tab`);
            activeTab.classList.add('active');
            activeTab.classList.remove('hidden');

            if (tabId === 'view') {
                await loadAllUnavailability();
            }
        });
    });
}

// Date Picker
function initDatePicker() {
    const container = document.getElementById('date-picker');
    const startDate = parseDateLocal(calendarData.startDate);
    const endDate = parseDateLocal(calendarData.endDate);

    if (!container || !startDate || !endDate) {
        console.error('Invalid calendar date range:', calendarData.startDate, calendarData.endDate);
        return;
    }

    if (!datePickerViewStart) {
        datePickerViewStart = getMonthStart(startDate);
    }
    datePickerViewStart = clampDatePickerViewStart(datePickerViewStart, startDate, endDate);

    if (!isDatePickerInitialized) {
        container.addEventListener('click', handleDatePickerClick);
        isDatePickerInitialized = true;
    }

    if (!isDatePickerResizeBound) {
        window.addEventListener('resize', refreshDatePicker);
        isDatePickerResizeBound = true;
    }

    renderDatePicker();
}

function getDatePickerMonthsToShow() {
    return window.innerWidth <= 700 ? 1 : 2;
}

function getMonthIndex(date) {
    return (date.getFullYear() * 12) + date.getMonth();
}

function toMonthDate(monthIndex) {
    const year = Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    return new Date(year, month, 1);
}

function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, months) {
    return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getMonthLabel(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function clampDatePickerViewStart(viewStart, rangeStart, rangeEnd) {
    const minMonth = getMonthStart(rangeStart);
    const maxMonth = getMonthStart(rangeEnd);
    const monthsToShow = getDatePickerMonthsToShow();

    const minIndex = getMonthIndex(minMonth);
    const maxIndex = getMonthIndex(maxMonth);
    const latestStartIndex = Math.max(minIndex, maxIndex - (monthsToShow - 1));

    const targetIndex = Math.min(
        Math.max(getMonthIndex(getMonthStart(viewStart)), minIndex),
        latestStartIndex
    );

    return toMonthDate(targetIndex);
}

function shiftDatePickerMonth(step) {
    const startDate = parseDateLocal(calendarData.startDate);
    const endDate = parseDateLocal(calendarData.endDate);

    if (!startDate || !endDate) return;

    datePickerViewStart = addMonths(datePickerViewStart, step);
    datePickerViewStart = clampDatePickerViewStart(datePickerViewStart, startDate, endDate);
    renderDatePicker();
}

function renderDatePicker() {
    const container = document.getElementById('date-picker');
    const startDate = parseDateLocal(calendarData.startDate);
    const endDate = parseDateLocal(calendarData.endDate);

    if (!container || !startDate || !endDate) return;

    if (!datePickerViewStart) {
        datePickerViewStart = getMonthStart(startDate);
    }
    datePickerViewStart = clampDatePickerViewStart(datePickerViewStart, startDate, endDate);

    const monthsToShow = getDatePickerMonthsToShow();
    const monthDates = Array.from({ length: monthsToShow }, (_, index) => addMonths(datePickerViewStart, index));
    const minMonth = getMonthStart(startDate);
    const maxMonth = getMonthStart(endDate);
    const latestStartIndex = Math.max(getMonthIndex(minMonth), getMonthIndex(maxMonth) - (monthsToShow - 1));

    const canGoPrev = getMonthIndex(datePickerViewStart) > getMonthIndex(minMonth);
    const canGoNext = getMonthIndex(datePickerViewStart) < latestStartIndex;

    const rangeLabel = monthDates.length === 1
        ? getMonthLabel(monthDates[0])
        : `${getMonthLabel(monthDates[0])} - ${getMonthLabel(monthDates[monthDates.length - 1])}`;

    container.innerHTML = `
        <div class="ntd-picker-shell">
            <div class="ntd-picker-toolbar">
                <button type="button" class="ntd-nav-btn" data-nav="prev" aria-label="${window.i18n.t('calendarSubmit.showPrevMonth')}" ${canGoPrev ? '' : 'disabled'}>
                    <span aria-hidden="true">&lsaquo;</span>
                </button>
                <div class="ntd-picker-range-label">${rangeLabel}</div>
                <button type="button" class="ntd-nav-btn" data-nav="next" aria-label="${window.i18n.t('calendarSubmit.showNextMonth')}" ${canGoNext ? '' : 'disabled'}>
                    <span aria-hidden="true">&rsaquo;</span>
                </button>
            </div>
            <div class="ntd-picker-months" data-months="${monthsToShow}">
                ${monthDates.map(monthDate => renderDatePickerMonth(monthDate, startDate, endDate)).join('')}
            </div>
        </div>
    `;
}

function renderDatePickerMonth(monthDate, rangeStart, rangeEnd) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weekdayHtml = DATE_PICKER_WEEKDAYS
        .map(label => `<div class="ntd-weekday">${label}</div>`)
        .join('');

    let dayCellsHtml = '';

    for (let slot = 0; slot < 42; slot++) {
        const dayNumber = slot - firstWeekday + 1;

        if (dayNumber < 1 || dayNumber > daysInMonth) {
            dayCellsHtml += '<div class="ntd-day ntd-day--placeholder" aria-hidden="true"></div>';
            continue;
        }

        const dateObj = new Date(year, month, dayNumber);
        const dateStr = formatDateLocal(dateObj);
        const isInRange = dateObj >= rangeStart && dateObj <= rangeEnd;
        const isSubmitted = userSubmittedDates.includes(dateStr);
        const isPending = selectedDates.includes(dateStr);

        const classNames = ['ntd-day'];
        const attributes = ['type="button"'];

        const isBlocked = (calendarData.blockedDates || []).includes(dateStr);

        if (!isInRange) {
            classNames.push('is-out-of-range');
            attributes.push('disabled');
        } else if (isBlocked) {
            classNames.push('is-blocked');
            attributes.push('disabled');
            attributes.push(`title="${window.i18n.t('calendarView.blocked.tooltip')}"`);
        } else if (isSubmitted) {
            classNames.push('is-submitted');
            attributes.push('disabled');
            attributes.push(`title="${window.i18n.t('calendarSubmit.rangeTitleSubmitted')}"`);
        } else if (isPending) {
            classNames.push('is-pending');
            attributes.push('data-date="' + dateStr + '"');
            attributes.push('aria-pressed="true"');
        } else {
            attributes.push('data-date="' + dateStr + '"');
            attributes.push('aria-pressed="false"');
        }

        if (isInRange && (isSubmitted || isPending)) {
            const rangeSource = isSubmitted ? userSubmittedDates : selectedDates;
            const rangePosition = getRangePosition(dateStr, rangeSource);
            if (rangePosition) {
                classNames.push(rangePosition);
            }
        }

        if (!attributes.some(attr => attr.startsWith('title='))) {
            if (!isInRange) {
                attributes.push(`title="${window.i18n.t('calendarSubmit.titleOutsideRange')}"`);
            } else if (isPending) {
                attributes.push(`title="${window.i18n.t('calendarSubmit.rangeTitlePending')}"`);
            } else {
                attributes.push(`title="${window.i18n.t('calendarSubmit.titleClickToMark')}"`);
            }
        }

        dayCellsHtml += `
            <button class="${classNames.join(' ')}" ${attributes.join(' ')}>
                <span class="ntd-day-number">${dayNumber}</span>
            </button>
        `;
    }

    return `
        <section class="ntd-picker-month" aria-label="${getMonthLabel(monthDate)}">
            <h4 class="ntd-picker-month-title">${getMonthLabel(monthDate)}</h4>
            <div class="ntd-picker-grid">
                ${weekdayHtml}
                ${dayCellsHtml}
            </div>
        </section>
    `;
}

function handleDatePickerClick(event) {
    const navButton = event.target.closest('.ntd-nav-btn');
    if (navButton) {
        const direction = navButton.dataset.nav === 'next' ? 1 : -1;
        shiftDatePickerMonth(direction);
        return;
    }

    const dayButton = event.target.closest('.ntd-day[data-date]');
    if (!dayButton) return;

    toggleDateSelection(dayButton.dataset.date);
}

function toggleDateSelection(dateStr) {
    if ((calendarData.blockedDates || []).includes(dateStr)) return;
    if (!dateStr) return;

    if (selectedDates.includes(dateStr)) {
        selectedDates = selectedDates.filter(d => d !== dateStr);
    } else if (!userSubmittedDates.includes(dateStr)) {
        selectedDates.push(dateStr);
    }

    selectedDates.sort();
    updateSelectedDatesUI();
    updateSubmitButton();
    refreshDatePicker();
}

// Determine if a date is start, middle, or end of a continuous range
function getRangePosition(dateStr, dateList) {
    if (!Array.isArray(dateList) || !dateList.includes(dateStr)) {
        return null;
    }

    const prevDate = getAdjacentDateStr(dateStr, -1);
    const nextDate = getAdjacentDateStr(dateStr, 1);

    const hasPrev = dateList.includes(prevDate);
    const hasNext = dateList.includes(nextDate);

    if (!hasPrev && !hasNext) {
        return 'range-single'; // isolated date
    } else if (!hasPrev && hasNext) {
        return 'range-start';
    } else if (hasPrev && hasNext) {
        return 'range-middle';
    } else if (hasPrev && !hasNext) {
        return 'range-end';
    }
    return null;
}

// Get adjacent date string (offset in days)
function getAdjacentDateStr(dateStr, offsetDays) {
    const date = parseDateLocal(dateStr);
    if (!date) return dateStr;
    date.setDate(date.getDate() + offsetDays);
    return formatDateLocal(date);
}

function refreshDatePicker() {
    if (!isDatePickerInitialized) return;
    renderDatePicker();
}

function addDateRange(start, end) {
    const dates = [];
    let current = parseDateLocal(start);
    const endDate = parseDateLocal(end);

    if (!current || !endDate) return;

    while (current <= endDate) {
        dates.push(formatDateLocal(current));
        current.setDate(current.getDate() + 1);
    }

    dates.forEach(date => {
        if (!selectedDates.includes(date)) {
            selectedDates.push(date);
        }
    });

    selectedDates.sort();
    updateSelectedDatesUI();
    updateSubmitButton();
    refreshDatePicker();
}

// Form handlers
function initFormHandlers() {
    // The participant <select> gets its own change listener in setupParticipantInput(),
    // so it must not be wired up again here.
    document.getElementById('submit-btn')?.addEventListener('click', submitUnavailability);
    document.getElementById('reset-btn')?.addEventListener('click', resetUserDates);
}

function updateSubmitButton() {
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = !currentParticipant;
}

function updateSelectedDatesUI() {
    const container = document.getElementById('selected-dates-list');

    if (!container) return;

    const submittedRanges = groupIntoRanges(userSubmittedDates);
    const pendingRanges = groupIntoRanges(selectedDates);

    if (submittedRanges.length === 0 && pendingRanges.length === 0) {
        container.innerHTML = `<p class="empty-message">${window.i18n.t('calendarSubmit.noDatesSelected')}</p>`;
        return;
    }

    const submittedHtml = submittedRanges.map(range => {
        const displayText = range.start === range.end
            ? formatDateDisplay(range.start)
            : `${formatDateDisplay(range.start)} - ${formatDateDisplay(range.end)}`;

        return `
            <span class="date-tag date-tag-submitted" title="${window.i18n.t('calendarSubmit.dateTagSubmittedTitle')}">
                ${displayText}
            </span>
        `;
    }).join('');

    const pendingHtml = pendingRanges.map((range, index) => {
        const displayText = range.start === range.end
            ? formatDateDisplay(range.start)
            : `${formatDateDisplay(range.start)} - ${formatDateDisplay(range.end)}`;

        return `
            <span class="date-tag date-tag-pending" title="${window.i18n.t('calendarSubmit.dateTagPendingTitle')}">
                ${displayText}
                <span class="remove-btn" data-range-index="${index}">&times;</span>
            </span>
        `;
    }).join('');

    container.innerHTML = `
        ${pendingHtml ? `
            <div class="dates-group">
                <p class="dates-group-label">${window.i18n.t('calendarSubmit.pendingGroupLabel')}</p>
                <div class="dates-chip-row">${pendingHtml}</div>
            </div>
        ` : ''}
        ${submittedHtml ? `
            <div class="dates-group">
                <p class="dates-group-label">${window.i18n.t('calendarSubmit.submittedGroupLabel')}</p>
                <div class="dates-chip-row">${submittedHtml}</div>
            </div>
        ` : ''}
    `;

    container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rangeIndex = parseInt(e.target.dataset.rangeIndex);
            removeRange(pendingRanges[rangeIndex]);
        });
    });
}

function removeRange(range) {
    const start = new Date(range.start + 'T12:00:00');
    const end = new Date(range.end + 'T12:00:00');

    selectedDates = selectedDates.filter(dateStr => {
        const date = new Date(dateStr + 'T12:00:00');
        return date < start || date > end;
    });

    updateSelectedDatesUI();
    updateSubmitButton();
    refreshDatePicker();
}

// Submit unavailability
async function submitUnavailability() {
    if (!currentParticipant) return;

    const calendarId = calendarData.id || getCalendarId();

    if (!calendarId) {
        showStatus('error', window.i18n.t('calendarSubmit.errorCalendarIdMissing'));
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = window.i18n.t('common.submitting');

    // Always submit the union so existing submitted dates are preserved.
    const submittedDates = [...selectedDates];
    const nextUnavailableDates = Array.from(new Set([
        ...userSubmittedDates,
        ...selectedDates
    ])).sort();

    try {
        const response = await fetchFunction(`/.netlify/functions/submit-unavailability?calendarId=${encodeURIComponent(calendarId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantName: resolvedParticipantKey || currentParticipant,
                unavailableDates: nextUnavailableDates
            })
        });

        const result = await response.json();

        if (response.ok) {
            const participantKey = result.participant || currentParticipant;
            if (!submittedParticipants.includes(participantKey)) {
                submittedParticipants.push(participantKey);
            }
            const message = selectedDates.length === 0
                ? (userSubmittedDates.length > 0
                    ? window.i18n.t('calendarSubmit.successNoNewDates')
                    : window.i18n.t('calendarSubmit.successAllAvailable'))
                : window.i18n.t('calendarSubmit.successSubmitted');
            showStatus('success', message);

            // Move submitted dates to userSubmittedDates (for solid highlighting)
            // and update allUnavailability locally without refresh
            const mergedSubmittedDates = Array.isArray(result.unavailableDates)
                ? result.unavailableDates
                : nextUnavailableDates;

            mergedSubmittedDates.forEach(date => {
                if (!userSubmittedDates.includes(date)) {
                    userSubmittedDates.push(date);
                }
                // Update allUnavailability locally
                if (!allUnavailability[date]) {
                    allUnavailability[date] = [];
                }
                if (!allUnavailability[date].includes(participantKey)) {
                    allUnavailability[date].push(participantKey);
                }
            });

            // Clear selected dates AFTER moving them
            selectedDates = [];

            // Update the selected dates UI
            updateSelectedDatesUI();

            // Refresh the date picker to show solid highlights
            refreshDatePicker();

            // Re-render availability calendar to show updated counts
            renderAvailabilityCalendar();
            renderPendingParticipants();

            // Refresh from backend, keeping the dates the server just confirmed in case
            // the immediate read-back is still stale.
            await loadUserSubmissions(mergedSubmittedDates);
        } else {
            showStatus('error', result.error || window.i18n.t('calendarSubmit.errorSubmitFailed'));
        }
    } catch (error) {
        showStatus('error', window.i18n.t('common.networkError'));
        console.error(error);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = window.i18n.t('calendarSubmit.submitBtn');
    updateSubmitButton();
}

async function resetUserDates() {
    if (!currentParticipant) {
        showStatus('error', window.i18n.t('calendarSubmit.errorEnterName'));
        return;
    }

    if (!confirm(window.i18n.t('calendarSubmit.confirmReset'))) {
        return;
    }

    const calendarId = calendarData.id || getCalendarId();

    if (!calendarId) {
        showStatus('error', window.i18n.t('calendarSubmit.errorCalendarIdMissing'));
        return;
    }

    const resetBtn = document.getElementById('reset-btn');
    resetBtn.disabled = true;
    resetBtn.textContent = window.i18n.t('common.resetting');

    try {
        const participantForReset = resolvedParticipantKey || currentParticipant;
        const response = await fetchFunction(`/.netlify/functions/reset-unavailability?calendarId=${encodeURIComponent(calendarId)}&participant=${encodeURIComponent(participantForReset)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            showStatus('success', window.i18n.t('calendarSubmit.successReset'));
            selectedDates = [];
            submittedParticipants = submittedParticipants.filter(
                name => normalizeParticipantName(name) !== normalizeParticipantName(participantForReset)
            );
            updateSelectedDatesUI();
            await loadUserSubmissions();
            await loadAllUnavailability();
        } else {
            showStatus('error', window.i18n.t('calendarSubmit.errorResetFailed'));
        }
    } catch (error) {
        showStatus('error', window.i18n.t('common.networkError'));
        console.error(error);
    }

    resetBtn.disabled = false;
    resetBtn.textContent = window.i18n.t('calendarSubmit.resetBtn');
}

function showStatus(type, message) {
    const submitStatus = document.getElementById('submit-status');
    submitStatus.className = `status-message ${type}`;
    submitStatus.textContent = message;

    setTimeout(() => {
        submitStatus.className = 'status-message';
    }, 4000);
}

// Load user submissions
// `confirmedDates` are dates the server just acknowledged; they're kept even if the
// immediate read-back hasn't caught up yet.
async function loadUserSubmissions(confirmedDates = []) {
    const requestId = ++userSubmissionsRequestId;
    const requestedParticipant = currentParticipant;

    if (!currentParticipant) {
        userSubmittedDates = [];
        selectedDates = [];
        resolvedParticipantKey = '';
        updateSelectedDatesUI();
        refreshDatePicker();
        return;
    }

    try {
        const response = await fetchFunction(`/.netlify/functions/get-user-submissions?calendarId=${calendarData.id}&participant=${encodeURIComponent(currentParticipant)}`);
        const data = await response.json();
        let submissions = normalizeSubmissions(data.submissions, requestedParticipant);

        if (submissions.length === 0) {
            const allResponse = await fetchFunction(`/.netlify/functions/get-user-submissions?calendarId=${calendarData.id}`);
            const allData = await allResponse.json();
            const allSubmissions = normalizeSubmissions(allData.submissions);
            const participantQuery = normalizeParticipantName(requestedParticipant);
            const matches = allSubmissions.filter(sub => normalizeParticipantName(sub.participantName || '') === participantQuery);

            if (matches.length > 0) {
                submissions = [mergeSubmissionsByParticipant(matches, requestedParticipant)];
            }
        }

        // A newer request (or a participant switch) superseded this one.
        if (requestId !== userSubmissionsRequestId || requestedParticipant !== currentParticipant) return;

        resolvedParticipantKey = submissions[0]?.participantName || requestedParticipant;

        userSubmittedDates = [...confirmedDates];
        if (submissions.length > 0) {
            submissions.forEach(sub => {
                if (sub.dates) {
                    sub.dates.forEach(d => {
                        if (!userSubmittedDates.includes(d)) {
                            userSubmittedDates.push(d);
                        }
                    });
                }
            });
        }
        userSubmittedDates.sort();

        updateSelectedDatesUI();
        refreshDatePicker();
    } catch (error) {
        console.error('Failed to load submissions:', error);
        if (requestId !== userSubmissionsRequestId) return;
        userSubmittedDates = [...confirmedDates];
        resolvedParticipantKey = resolvedParticipantKey || requestedParticipant;
        updateSelectedDatesUI();
        refreshDatePicker();
    }
}

// Availability view and shared utilities are loaded from:
// - /calendar-availability.js
// - /calendar-utils.js

