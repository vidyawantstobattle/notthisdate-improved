// ===== CALENDAR PAGE =====
// This handles the shared calendar view where participants submit their unavailability

// State
let calendarData = null;
let selectedDates = [];
let userSubmittedDates = [];
let flatpickrInstance = null;
let allUnavailability = {};
let currentParticipant = '';
const PROD_SITE_URL = 'https://reverse-date-picker.netlify.app';

async function fetchFunction(path, options = {}) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
        return fetch(`${PROD_SITE_URL}${path}`, options);
    }

    return fetch(path, options);
}

// Get calendar ID from URL
function getCalendarId() {
    const path = window.location.pathname;
    const match = path.match(/\/c\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
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

        const select = document.createElement('select');
        select.id = 'participant-select';
        select.innerHTML = `
            <option value="">Select your name...</option>
            ${calendarData.participants.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
        `;
        container.appendChild(select);

        // Add helpful hint
        const hint = document.createElement('p');
        hint.className = 'form-hint';
        hint.textContent = 'Select your name from the list to submit your unavailable dates.';
        container.appendChild(hint);

        // Add change listener
        select.addEventListener('change', (e) => {
            currentParticipant = e.target.value;
            updateSubmitButton();
            if (currentParticipant) {
                loadUserSubmissions();
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

function confirmName() {
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
            <button type="button" class="change-name-btn" title="Change name">✎</button>
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
    loadUserSubmissions();
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
        showVerificationError('Please enter both your email and name.');
        return;
    }

    if (!isValidEmail(verificationEmail)) {
        showVerificationError('Please enter a valid email address.');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
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
        document.getElementById('sent-email-display').textContent = verificationEmail;

        // Show a hint for demo purposes
        showVerificationError(`Demo mode: Your code is ${verificationCode}`);
        errorDiv.classList.remove('error');
        errorDiv.style.color = 'var(--primary-color)';
        errorDiv.style.background = 'var(--primary-bg)';

    } catch (error) {
        showVerificationError('Failed to send verification code. Please try again.');
    }

    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Verification Code';
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
        showVerificationError('Invalid code. Please try again.');
        codeInput.value = '';
        codeInput.focus();
    }
}

function showVerifiedForm(name, email) {
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
    loadUserSubmissions();
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
        btn.addEventListener('click', () => {
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
                loadAllUnavailability();
            }
        });
    });
}

// Date Picker
function initDatePicker() {
    const startDate = new Date(calendarData.startDate + 'T00:00:00');
    const endDate = new Date(calendarData.endDate + 'T00:00:00');
    const isMobile = window.innerWidth <= 600;

    flatpickrInstance = flatpickr('#date-picker', {
        mode: 'multiple',
        minDate: startDate,
        maxDate: endDate,
        dateFormat: 'Y-m-d',
        inline: true,
        showMonths: isMobile ? 1 : 2,
        onChange: (selectedDateArray) => {
            // Get the last selected date (most recent click)
            if (selectedDateArray.length > 0) {
                const lastDate = selectedDateArray[selectedDateArray.length - 1];
                const dateStr = formatDateLocal(lastDate);

                // Toggle date selection
                if (selectedDates.includes(dateStr)) {
                    // Remove if already in our list
                    selectedDates = selectedDates.filter(d => d !== dateStr);
                } else if (!userSubmittedDates.includes(dateStr)) {
                    // Add if not already submitted
                    selectedDates.push(dateStr);
                }

                selectedDates.sort();
                updateSelectedDatesUI();
                updateSubmitButton();
            }

            // Clear flatpickr's internal selection to allow re-clicking
            flatpickrInstance.clear();
            refreshDatePicker();
        },
        onDayCreate: (dObj, dStr, fp, dayElem) => {
            const dateStr = formatDateLocal(dayElem.dateObj);

            // Check which list contains this date
            const isSubmitted = userSubmittedDates.includes(dateStr);
            const isPending = selectedDates.includes(dateStr);

            if (isSubmitted || isPending) {
                const dateList = isSubmitted ? userSubmittedDates : selectedDates;
                const baseClass = isSubmitted ? 'user-submitted' : 'user-pending';

                dayElem.classList.add(baseClass);

                // Determine range position based on adjacency
                const rangePosition = getRangePosition(dateStr, dateList);
                if (rangePosition) {
                    dayElem.classList.add(rangePosition);
                }
            }
        }
    });
}

// Determine if a date is start, middle, or end of a continuous range
function getRangePosition(dateStr, dateList) {
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
    const date = new Date(dateStr + 'T12:00:00');
    date.setDate(date.getDate() + offsetDays);
    return formatDateLocal(date);
}

function refreshDatePicker() {
    if (flatpickrInstance) {
        const isMobile = window.innerWidth <= 600;
        const currentMonth = isMobile ? flatpickrInstance.currentMonth : null;
        const currentYear = isMobile ? flatpickrInstance.currentYear : null;

        flatpickrInstance.redraw();

        if (isMobile && currentMonth !== null) {
            flatpickrInstance.changeMonth(currentMonth, false);
            flatpickrInstance.changeYear(currentYear);
        }
    }
}

function addDateRange(start, end) {
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
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
    const participantEl = document.getElementById('participant-select') || document.getElementById('participant-input');

    participantEl?.addEventListener('change', () => {
        currentParticipant = participantEl.value.trim();
        updateSubmitButton();
        loadUserSubmissions();
    });

    participantEl?.addEventListener('input', () => {
        currentParticipant = participantEl.value.trim();
        updateSubmitButton();
    });

    document.getElementById('submit-btn')?.addEventListener('click', submitUnavailability);
    document.getElementById('reset-btn')?.addEventListener('click', resetUserDates);
}

function updateSubmitButton() {
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = !currentParticipant;
}

function updateSelectedDatesUI(justSubmitted = false) {
    const container = document.getElementById('selected-dates-list');

    if (selectedDates.length === 0) {
        if (justSubmitted) {
            // Show success message instead of empty message after successful submit
            container.innerHTML = '<p class="success-message">✓ Dates submitted successfully! Select more dates if needed.</p>';
        } else {
            container.innerHTML = '<p class="empty-message">No dates selected yet</p>';
        }
        return;
    }

    const ranges = groupIntoRanges(selectedDates);

    container.innerHTML = ranges.map((range, index) => {
        const displayText = range.start === range.end
            ? formatDateDisplay(range.start)
            : `${formatDateDisplay(range.start)} - ${formatDateDisplay(range.end)}`;

        return `
            <span class="date-tag">
                ${displayText}
                <span class="remove-btn" data-range-index="${index}">&times;</span>
            </span>
        `;
    }).join('');

    container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rangeIndex = parseInt(e.target.dataset.rangeIndex);
            removeRange(ranges[rangeIndex]);
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
        showStatus('error', 'Calendar ID not found. Please refresh the page.');
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Store the dates we're submitting
    const submittedDates = [...selectedDates];

    try {
        const response = await fetchFunction(`/.netlify/functions/submit-unavailability?calendarId=${encodeURIComponent(calendarId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantName: currentParticipant,
                unavailableDates: selectedDates
            })
        });

        const result = await response.json();

        if (response.ok) {
            const message = selectedDates.length === 0
                ? 'Recorded! You\'re available for all dates! 🎉'
                : 'Your unavailability has been recorded!';
            showStatus('success', message);

            // Move submitted dates to userSubmittedDates (for solid highlighting)
            // and update allUnavailability locally without refresh
            submittedDates.forEach(date => {
                if (!userSubmittedDates.includes(date)) {
                    userSubmittedDates.push(date);
                }
                // Update allUnavailability locally
                if (!allUnavailability[date]) {
                    allUnavailability[date] = [];
                }
                if (!allUnavailability[date].includes(currentParticipant)) {
                    allUnavailability[date].push(currentParticipant);
                }
            });

            // Clear selected dates AFTER moving them
            selectedDates = [];

            // Update the selected dates UI to show success state, not empty
            updateSelectedDatesUI(true); // Pass true to indicate successful submit

            // Refresh the date picker to show solid highlights
            refreshDatePicker();

            // Re-render availability calendar to show updated counts
            renderAvailabilityCalendar();

            // Load user submissions to show in the list
            loadUserSubmissions();
        } else {
            showStatus('error', result.error || 'Failed to submit');
        }
    } catch (error) {
        showStatus('error', 'Network error. Please try again.');
        console.error(error);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Unavailability';
    updateSubmitButton();
}

async function resetUserDates() {
    if (!currentParticipant) {
        showStatus('error', 'Please enter your name first');
        return;
    }

    if (!confirm('Are you sure you want to reset all your unavailable dates?')) {
        return;
    }

    const calendarId = calendarData.id || getCalendarId();

    if (!calendarId) {
        showStatus('error', 'Calendar ID not found. Please refresh the page.');
        return;
    }

    const resetBtn = document.getElementById('reset-btn');
    resetBtn.disabled = true;
    resetBtn.textContent = 'Resetting...';

    try {
        const response = await fetchFunction(`/.netlify/functions/reset-unavailability?calendarId=${encodeURIComponent(calendarId)}&participant=${encodeURIComponent(currentParticipant)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            showStatus('success', 'Your dates have been reset!');
            selectedDates = [];
            updateSelectedDatesUI();
            loadUserSubmissions();
            loadAllUnavailability();
        } else {
            showStatus('error', 'Failed to reset');
        }
    } catch (error) {
        showStatus('error', 'Network error. Please try again.');
        console.error(error);
    }

    resetBtn.disabled = false;
    resetBtn.textContent = 'Reset My Dates';
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
async function loadUserSubmissions() {
    const container = document.getElementById('user-submissions');

    if (!currentParticipant) {
        container.innerHTML = '<p class="empty-message">Enter your name to see your submissions</p>';
        userSubmittedDates = [];
        refreshDatePicker();
        return;
    }

    try {
        const response = await fetchFunction(`/.netlify/functions/get-user-submissions?calendarId=${calendarData.id}&participant=${encodeURIComponent(currentParticipant)}`);
        const data = await response.json();

        userSubmittedDates = [];
        if (data.submissions && data.submissions.length > 0) {
            data.submissions.forEach(sub => {
                if (sub.dates) {
                    sub.dates.forEach(d => {
                        if (!userSubmittedDates.includes(d)) {
                            userSubmittedDates.push(d);
                        }
                    });
                }
            });

            container.innerHTML = data.submissions.map(sub => {
                let datesDisplay;
                if (!sub.dates || sub.dates.length === 0) {
                    datesDisplay = '<span style="color: var(--success-color);">Available for all dates! 🎉</span>';
                } else {
                    const ranges = groupIntoRanges(sub.dates);
                    datesDisplay = ranges.map(r =>
                        r.start === r.end
                            ? formatDateDisplay(r.start)
                            : `${formatDateDisplay(r.start)} - ${formatDateDisplay(r.end)}`
                    ).join(', ');
                }

                return `
                    <div class="submission-item">
                        <div class="submission-date">Submitted: ${new Date(sub.timestamp).toLocaleString()}</div>
                        <div class="submission-dates">${sub.dates && sub.dates.length > 0 ? 'Unavailable: ' : ''}${datesDisplay}</div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="empty-message">No submissions yet</p>';
        }

        refreshDatePicker();
    } catch (error) {
        console.error('Failed to load submissions:', error);
        container.innerHTML = '<p class="empty-message">Failed to load submissions</p>';
        userSubmittedDates = [];
        refreshDatePicker();
    }
}

// Availability view and shared utilities are loaded from:
// - /calendar-availability.js
// - /calendar-utils.js

