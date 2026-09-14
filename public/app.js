// ===== NETLIFY IDENTITY SETUP =====
const netlifyIdentity = window.netlifyIdentity;
let currentUser = null;
let participantsTagsInput = null;
const MAX_CALENDARS_PER_USER = 10;
let userCalendarCount = 0;
let cachedCalendars = [];
let blockedDates = [];

// ===== TAGS INPUT CLASS =====
class TagsInput {
    constructor(container, options = {}) {
        this.container = container;
        this.tags = options.initialTags || [];
        this.placeholder = options.placeholder || window.i18n.t('dashboard.createModal.participantsPlaceholder');
        this.onTagsChange = options.onTagsChange || (() => {});

        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = '';
        this.container.className = 'tags-input-container';

        // Render existing tags
        this.tags.forEach((tag, index) => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            tagEl.innerHTML = `
                ${escapeHtml(tag)}
                <button type="button" class="tag-remove" data-index="${index}" aria-label="${window.i18n.t('dashboard.createModal.removeTag', { tag: escapeHtml(tag) })}">×</button>
            `;
            this.container.appendChild(tagEl);
        });

        // Add input
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'tags-input';
        this.input.placeholder = this.tags.length === 0 ? this.placeholder : window.i18n.t('dashboard.createModal.addAnotherPlaceholder');
        this.container.appendChild(this.input);
    }

    bindEvents() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag(this.input.value);
            } else if (e.key === 'Backspace' && this.input.value === '' && this.tags.length > 0) {
                this.removeTag(this.tags.length - 1);
            }
        });

        // Also add on blur (when user clicks away)
        this.input.addEventListener('blur', () => {
            if (this.input.value.trim()) {
                this.addTag(this.input.value);
            }
        });

        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-remove')) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(e.target.dataset.index);
                this.removeTag(index);
            } else {
                this.input.focus();
            }
        });
    }

    addTag(value) {
        const trimmed = value.trim();
        if (trimmed && !this.tags.includes(trimmed)) {
            this.tags.push(trimmed);
            this.render();
            this.bindEvents();
            this.onTagsChange(this.tags);
            this.input.focus();
        } else {
            this.input.value = '';
        }
    }

    removeTag(index) {
        this.tags.splice(index, 1);
        this.render();
        this.bindEvents();
        this.onTagsChange(this.tags);
        this.input.focus();
    }

    getTags() {
        return [...this.tags];
    }

    setTags(tags) {
        this.tags = [...tags];
        this.render();
        this.bindEvents();
    }

    clear() {
        this.tags = [];
        this.render();
        this.bindEvents();
    }
}

// ===== PASSWORD VALIDATION =====
const passwordRules = {
    minLength: { test: (p) => p.length >= 8, message: 'At least 8 characters' },
    hasUppercase: { test: (p) => /[A-Z]/.test(p), message: 'One uppercase letter' },
    hasLowercase: { test: (p) => /[a-z]/.test(p), message: 'One lowercase letter' },
    hasNumber: { test: (p) => /\d/.test(p), message: 'One number' },
    hasSpecial: { test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), message: 'One special character' }
};

function setupPasswordValidation() {
    // Hook into Netlify Identity widget's password fields
    // The widget creates its own form, so we need to add validation after it opens
    netlifyIdentity.on('open', () => {
        setTimeout(() => {
            const passwordInputs = document.querySelectorAll('.netlify-identity-widget input[type="password"]');
            passwordInputs.forEach(input => {
                if (!input.parentElement.classList.contains('password-field')) {
                    wrapPasswordField(input);
                }
            });
        }, 100);
    });
}

function wrapPasswordField(input) {
    // Add wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'password-field';
    wrapper.style.position = 'relative';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    // Add toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
    toggleBtn.innerHTML = `
        <svg class="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
        <svg class="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="display:none">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    `;
    toggleBtn.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#8898aa;padding:4px;';
    wrapper.appendChild(toggleBtn);

    // Update input padding
    input.style.paddingRight = '40px';

    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggleBtn.querySelector('.eye-open').style.display = isPassword ? 'none' : 'block';
        toggleBtn.querySelector('.eye-closed').style.display = isPassword ? 'block' : 'none';
    });

    // Add validation requirements display for signup
    if (input.closest('form')?.querySelector('button[type="submit"]')?.textContent?.toLowerCase().includes('sign up')) {
        addPasswordRequirements(input, wrapper);
    }
}

function addPasswordRequirements(input, wrapper) {
    const requirements = document.createElement('div');
    requirements.className = 'password-requirements';
    requirements.style.cssText = 'margin-top:8px;padding:10px;background:#f6f9fc;border-radius:6px;font-size:12px;';
    requirements.innerHTML = `
        <p style="margin:0 0 6px 0;font-weight:500;color:#697386;">Password must contain:</p>
        <ul style="margin:0;padding:0;list-style:none;">
            ${Object.entries(passwordRules).map(([key, rule]) => `
                <li id="req-${key}" style="display:flex;align-items:center;gap:6px;padding:2px 0;color:#8898aa;transition:color 0.15s;">
                    <span class="icon" style="width:14px;text-align:center;">○</span>
                    <span>${rule.message}</span>
                </li>
            `).join('')}
        </ul>
    `;
    wrapper.parentNode.insertBefore(requirements, wrapper.nextSibling);

    input.addEventListener('input', () => {
        const password = input.value;
        Object.entries(passwordRules).forEach(([key, rule]) => {
            const li = document.getElementById(`req-${key}`);
            if (li) {
                const isValid = rule.test(password);
                li.style.color = isValid ? '#30c67c' : '#8898aa';
                li.querySelector('.icon').textContent = isValid ? '✓' : '○';
            }
        });
    });
}

// Initialize Netlify Identity
function initAuth() {
    netlifyIdentity.on('init', user => {
        currentUser = user;
        updateUI();
        // If user is already logged in on page load, load their calendars
        if (user) {
            loadUserCalendars();
        }
    });

    netlifyIdentity.on('login', user => {
        currentUser = user;
        netlifyIdentity.close();
        updateUI();
        loadUserCalendars();
    });

    netlifyIdentity.on('logout', () => {
        currentUser = null;
        updateUI();
    });

    // Setup password validation for the identity widget
    setupPasswordValidation();

    // Configure Netlify Identity
    // When running locally, point to the production site since Identity can't work on localhost without netlify dev
    // When deployed, the site URL is automatically detected
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocal) {
        netlifyIdentity.init({
            APIUrl: 'https://reverse-date-picker.netlify.app/.netlify/identity'
        });
    } else {
        netlifyIdentity.init();
    }
}

// Update UI based on auth state
function updateUI() {
    const loginBtn = document.getElementById('login-btn');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const landingPage = document.getElementById('landing-page');
    const dashboardPage = document.getElementById('dashboard-page');

    if (currentUser) {
        // User is logged in
        loginBtn.classList.add('hidden');
        userMenu.classList.remove('hidden');
        userName.textContent = currentUser.user_metadata?.full_name || currentUser.email;

        landingPage.classList.add('hidden');
        dashboardPage.classList.remove('hidden');
    } else {
        // User is logged out
        loginBtn.classList.remove('hidden');
        userMenu.classList.add('hidden');

        landingPage.classList.remove('hidden');
        dashboardPage.classList.add('hidden');
    }
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', async () => {
    // Locales must be loaded before any synchronous t() call below.
    await window.i18n.whenReady();
    initAuth();
    setupEventListeners();
    setDefaultDates();
});

function setupEventListeners() {
    // Login buttons
    document.getElementById('login-btn')?.addEventListener('click', () => {
        netlifyIdentity.open('login');
    });

    document.getElementById('hero-login-btn')?.addEventListener('click', () => {
        netlifyIdentity.open('login');
    });

    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        netlifyIdentity.logout();
    });

    // Create calendar buttons
    document.getElementById('create-calendar-btn')?.addEventListener('click', openCreateModal);
    document.getElementById('create-first-calendar-btn')?.addEventListener('click', openCreateModal);

    // Modal controls
    document.querySelector('.modal-close')?.addEventListener('click', closeCreateModal);
    document.querySelector('.modal-cancel')?.addEventListener('click', closeCreateModal);
    document.querySelector('.modal-backdrop')?.addEventListener('click', closeCreateModal);

    // Form handling
    document.getElementById('create-calendar-form')?.addEventListener('submit', handleCreateCalendar);

    // Initialize participants tags input
    const participantsContainer = document.getElementById('participants-tags');
    if (participantsContainer) {
        participantsTagsInput = new TagsInput(participantsContainer, {
            placeholder: 'Type a name and press Enter',
            onTagsChange: (tags) => {
                console.log('Participants updated:', tags);
            }
        });
    }

    // Date range type toggle
    document.querySelectorAll('input[name="date-range-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const customRange = document.getElementById('custom-date-range');
            if (e.target.value === 'custom') {
                customRange.style.display = 'flex';
            } else {
                customRange.style.display = 'none';
            }
        });
    });

    // Participants type toggle
    document.querySelectorAll('input[name="participants-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const definedParticipants = document.getElementById('defined-participants');
            const openParticipantsOptions = document.getElementById('open-participants-options');

            if (e.target.value === 'defined') {
                definedParticipants.style.display = 'block';
                openParticipantsOptions?.classList.add('hidden');
            } else {
                definedParticipants.style.display = 'none';
                openParticipantsOptions?.classList.remove('hidden');
            }
        });
    });

    // Blocked dates
    document.getElementById('add-blocked-date-btn')?.addEventListener('click', addBlockedDate);
    document.getElementById('blocked-date-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addBlockedDate();
        }
    });
}

// ===== BLOCKED DATES =====
function addBlockedDate() {
    const input = document.getElementById('blocked-date-input');
    const value = input?.value;

    if (!value || blockedDates.includes(value)) {
        if (input) input.value = '';
        return;
    }

    blockedDates.push(value);
    blockedDates.sort();
    input.value = '';
    renderBlockedDates();
}

function removeBlockedDate(dateStr) {
    blockedDates = blockedDates.filter(d => d !== dateStr);
    renderBlockedDates();
}

function renderBlockedDates() {
    const container = document.getElementById('blocked-dates-list');
    if (!container) return;

    container.innerHTML = blockedDates.map(dateStr => `
        <span class="blocked-date-tag">
            ${formatDisplayDate(dateStr)}
            <button type="button" class="blocked-date-remove" data-date="${dateStr}"
                aria-label="${window.i18n.t('dashboard.createModal.removeBlockedDate', { date: formatDisplayDate(dateStr) })}">×</button>
        </span>
    `).join('');

    container.querySelectorAll('.blocked-date-remove').forEach(btn => {
        btn.addEventListener('click', () => removeBlockedDate(btn.dataset.date));
    });
}

// Set default dates for the form
function setDefaultDates() {
    const today = new Date();
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');

    if (startInput) startInput.value = formatDate(today);
    if (endInput) endInput.value = formatDate(oneMonthLater);

    // Set min date to today
    if (startInput) startInput.min = formatDate(today);
    if (endInput) endInput.min = formatDate(today);

    const blockedInput = document.getElementById('blocked-date-input');
    if (blockedInput) blockedInput.min = formatDate(today);
}

// ===== MODAL FUNCTIONS =====
function openCreateModal() {
    if (userCalendarCount >= MAX_CALENDARS_PER_USER) {
        showToast(window.i18n.t('dashboard.createModal.errorLimitReached', { limit: MAX_CALENDARS_PER_USER }));
        return;
    }

    openModal('create-calendar-modal');
}

function closeCreateModal() {
    closeModal('create-calendar-modal');
    document.getElementById('create-calendar-form').reset();
    if (participantsTagsInput) {
        participantsTagsInput.clear();
    }
    blockedDates = [];
    renderBlockedDates();
    setDefaultDates();
}

// ===== API FUNCTIONS =====
async function getAuthHeaders() {
    if (!currentUser) return {};
    const token = await netlifyIdentity.currentUser().jwt();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

async function loadUserCalendars() {
    const calendarsList = document.getElementById('calendars-list');
    const noCalendars = document.getElementById('no-calendars');

    calendarsList.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p class="loading-message" data-i18n="dashboard.loading">Loading your calendars...</p>
        </div>
    `;
    noCalendars.classList.add('hidden');

    try {
        const headers = await getAuthHeaders();
        const response = await fetchFunction('/.netlify/functions/get-calendars', { headers });

        if (!response.ok) throw new Error('Failed to load calendars');

        const data = await response.json();
        cachedCalendars = data.calendars || [];
        userCalendarCount = cachedCalendars.length;

        if (cachedCalendars.length > 0) {
            renderCalendars(cachedCalendars);
        } else {
            calendarsList.innerHTML = '';
            noCalendars.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading calendars:', error);
        calendarsList.innerHTML = `<p class="error-message">${window.i18n.t('dashboard.loadError')}</p>`;
    }
}

function renderCalendars(calendars) {
    const calendarsList = document.getElementById('calendars-list');

    calendarsList.innerHTML = calendars.map(cal => {
        const dateRange = cal.dateRangeType === 'open'
            ? window.i18n.t('dashboard.card.openEnded')
            : `${formatDisplayDate(cal.startDate)} - ${formatDisplayDate(cal.endDate)}`;

        const submittedCount = cal.submittedParticipantsCount || 0;
        const totalParticipants = Math.max(cal.participants?.length || 0, submittedCount);
        const participantsText = cal.participantsType === 'open'
            ? window.i18n.t('dashboard.card.joined', { count: submittedCount })
            : window.i18n.t('dashboard.card.submitted', { submitted: submittedCount, total: totalParticipants });

        const shareUrl = `${window.location.origin}/c/${cal.id}`;

        return `
            <div class="calendar-card">
                <div class="calendar-card-heading">
                    <h3 title="${escapeHtml(cal.name)}">${escapeHtml(cal.name)}</h3>
                    ${cal.participantsType === 'defined' ? `
                        <button type="button" class="calendar-card-edit-btn" onclick="openEditParticipantsModal('${cal.id}')"
                            title="${window.i18n.t('dashboard.card.editParticipants')}"
                            aria-label="${window.i18n.t('dashboard.card.editParticipants')}">
                            <img src="/images/setting_outline.svg" alt="">
                        </button>
                    ` : ''}
                </div>
                <p class="calendar-card-description" title="${escapeHtml(cal.description || '')}">${escapeHtml(cal.description || '')}</p>
                <div class="calendar-card-meta">
                    <span>📅 ${dateRange}</span>
                    <span>👥 ${participantsText}</span>
                </div>
                <div class="calendar-card-actions">
                    <a href="/c/${cal.id}" class="btn btn-primary btn-small">${window.i18n.t('dashboard.card.open')}</a>
                    <button class="btn btn-outline btn-small" onclick="copyShareLink('${shareUrl}', '${cal.id}')">${window.i18n.t('dashboard.card.shareLink')}</button>
                    <button class="btn btn-outline btn-small" onclick="deleteCalendar('${cal.id}')">${window.i18n.t('dashboard.card.delete')}</button>
                </div>
                <div class="share-link-row hidden" id="share-link-row-${cal.id}">
                    <input type="text" class="share-link-input" value="${shareUrl}" readonly onclick="this.select()">
                    <button class="share-link-copy-btn" onclick="copyShareLink('${shareUrl}', '${cal.id}')" title="Copy link" aria-label="Copy link">
                        <img src="/images/save_outline.svg" alt="" class="icon-copy">
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function handleCreateCalendar(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = window.i18n.t('common.creating');

    const name = document.getElementById('calendar-name').value.trim();
    const description = document.getElementById('calendar-description').value.trim();
    const dateRangeType = document.querySelector('input[name="date-range-type"]:checked').value;
    const participantsType = document.querySelector('input[name="participants-type"]:checked').value;

    let startDate, endDate;
    if (dateRangeType === 'custom') {
        startDate = document.getElementById('start-date').value;
        endDate = document.getElementById('end-date').value;

        if (!startDate || !endDate) {
            showToast(window.i18n.t('dashboard.createModal.errorMissingDates'));
            submitBtn.disabled = false;
            submitBtn.textContent = window.i18n.t('dashboard.createModal.submit');
            return;
        }

        if (new Date(endDate) <= new Date(startDate)) {
            showToast(window.i18n.t('dashboard.createModal.errorEndBeforeStart'));
            submitBtn.disabled = false;
            submitBtn.textContent = window.i18n.t('dashboard.createModal.submit');
            return;
        }
    } else {
        // Open-ended: next 6 months
        const today = new Date();
        startDate = today.toISOString().split('T')[0];
        const sixMonths = new Date(today);
        sixMonths.setMonth(sixMonths.getMonth() + 6);
        endDate = sixMonths.toISOString().split('T')[0];
    }

    let participants = [];
    let requireEmailVerification = false;

    if (participantsType === 'defined') {
        participants = participantsTagsInput ? participantsTagsInput.getTags() : [];

        if (participants.length === 0) {
            showToast(window.i18n.t('dashboard.createModal.errorNoParticipants'));
            submitBtn.disabled = false;
            submitBtn.textContent = window.i18n.t('dashboard.createModal.submit');
            return;
        }
    } else {
        // For open calendars, check if email verification is required
        requireEmailVerification = document.getElementById('require-email-verification')?.checked || false;
    }

    const outOfRangeBlocked = blockedDates.some(d => d < startDate || d > endDate);
    if (outOfRangeBlocked) {
        showToast(window.i18n.t('dashboard.createModal.errorBlockedOutOfRange'));
        submitBtn.disabled = false;
        submitBtn.textContent = window.i18n.t('dashboard.createModal.submit');
        return;
    }

    try {
        const headers = await getAuthHeaders();
        const response = await fetchFunction('/.netlify/functions/create-calendar', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name,
                description,
                dateRangeType,
                startDate,
                endDate,
                participantsType,
                participants,
                requireEmailVerification,
                blockedDates
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || error.message || 'Failed to create calendar');
        }

        const data = await response.json();
        closeCreateModal();

        // Append (matching backend order) instead of re-fetching: Netlify Blobs reads
        // immediately after a write can be stale and miss the calendar we just created.
        cachedCalendars = [...cachedCalendars, { ...data.calendar, submittedParticipantsCount: 0 }];
        userCalendarCount = cachedCalendars.length;
        document.getElementById('no-calendars')?.classList.add('hidden');
        renderCalendars(cachedCalendars);

        // Show share modal with the link
        showShareModal(data.calendar);
    } catch (error) {
        console.error('Error creating calendar:', error);
        showToast(window.i18n.t('dashboard.createModal.errorGeneric', { message: error.message }));
    }

    submitBtn.disabled = false;
    submitBtn.textContent = window.i18n.t('dashboard.createModal.submit');
}

// ===== SHARE MODAL =====
function showShareModal(calendar) {
    const shareModal = document.getElementById('share-modal');
    const shareLinkInput = document.getElementById('share-link-input');
    const openCalendarLink = document.getElementById('open-calendar-link');
    const participantsInfo = document.getElementById('share-participants-info');

    const shareUrl = `${window.location.origin}/c/${calendar.id}`;

    shareLinkInput.value = shareUrl;
    openCalendarLink.href = shareUrl;

    // Show different info based on participants type and email verification
    if (calendar.participantsType === 'open') {
        participantsInfo.className = 'share-info info-open';
        if (calendar.requireEmailVerification) {
            participantsInfo.innerHTML = `
                <h4>${window.i18n.t('dashboard.shareModal.verificationRequiredTitle')}</h4>
                <p>${window.i18n.t('dashboard.shareModal.verificationRequiredDesc')}</p>
            `;
        } else {
            participantsInfo.innerHTML = `
                <h4>${window.i18n.t('dashboard.shareModal.openAccessTitle')}</h4>
                <p>${window.i18n.t('dashboard.shareModal.openAccessDesc')}</p>
            `;
        }
    } else {
        participantsInfo.className = 'share-info info-defined';
        participantsInfo.innerHTML = `
            <h4>${window.i18n.t('dashboard.shareModal.definedTitle')}</h4>
            <p>${window.i18n.t('dashboard.shareModal.definedDesc', { names: escapeHtml(calendar.participants.join(', ')) })}</p>
        `;
    }

    openModal('share-modal');

    // Setup close handlers
    shareModal.querySelectorAll('[data-close-share]').forEach(el => {
        el.onclick = () => closeShareModal();
    });

    // Setup copy button
    const copyBtn = document.getElementById('copy-link-btn');
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            copyBtn.querySelector('.copy-text').classList.add('hidden');
            copyBtn.querySelector('.copied-text').classList.remove('hidden');
            setTimeout(() => {
                copyBtn.querySelector('.copy-text').classList.remove('hidden');
                copyBtn.querySelector('.copied-text').classList.add('hidden');
            }, 2000);
        }).catch(() => {
            shareLinkInput.select();
            document.execCommand('copy');
        });
    };
}

function closeShareModal() {
    closeModal('share-modal');
}

// ===== EDIT PARTICIPANTS MODAL =====
let editParticipantsTagsInput = null;
let editingCalendarId = null;

function openEditParticipantsModal(calendarId) {
    const calendar = cachedCalendars.find(cal => cal.id === calendarId);
    if (!calendar) return;

    editingCalendarId = calendarId;

    const modal = document.getElementById('edit-participants-modal');
    const errorDiv = document.getElementById('edit-participants-error');
    const container = document.getElementById('edit-participants-tags');

    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';
    container.innerHTML = '';

    editParticipantsTagsInput = new TagsInput(container, {
        initialTags: [...(calendar.participants || [])]
    });

    const close = () => {
        closeModal('edit-participants-modal');
        editingCalendarId = null;
    };

    modal.querySelectorAll('[data-close-participants]').forEach(el => {
        el.onclick = close;
    });

    document.getElementById('save-participants-btn').onclick = () => saveParticipants(close);

    openModal('edit-participants-modal');
}

async function saveParticipants(close) {
    const saveBtn = document.getElementById('save-participants-btn');
    const errorDiv = document.getElementById('edit-participants-error');
    const participants = editParticipantsTagsInput ? editParticipantsTagsInput.getTags() : [];
    const calendarId = editingCalendarId;

    if (participants.length === 0) {
        errorDiv.textContent = window.i18n.t('dashboard.editParticipants.errorEmpty');
        errorDiv.classList.remove('hidden');
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = window.i18n.t('common.saving');
    errorDiv.classList.add('hidden');

    try {
        const headers = await getAuthHeaders();
        const response = await fetchFunction(`/.netlify/functions/update-participants?id=${encodeURIComponent(calendarId)}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ participants })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to update participants');
        }

        // Update the cached card in place rather than re-fetching, since an immediate
        // re-read can still return the previous participant list.
        cachedCalendars = cachedCalendars.map(cal => (
            cal.id === calendarId ? { ...cal, participants: result.participants } : cal
        ));
        renderCalendars(cachedCalendars);

        close();
        showToast(window.i18n.t('dashboard.editParticipants.saved'));
    } catch (error) {
        console.error('Error updating participants:', error);
        errorDiv.textContent = error.message || window.i18n.t('dashboard.editParticipants.saveFailed');
        errorDiv.classList.remove('hidden');
    }

    saveBtn.disabled = false;
    saveBtn.textContent = window.i18n.t('common.save');
}

// ===== CONFIRM MODAL =====
function showConfirmModal({ title = window.i18n.t('common.areYouSure'), message = '', confirmLabel = window.i18n.t('common.confirm'), onConfirm }) {
    const modal = document.getElementById('confirm-modal');
    const confirmBtn = document.getElementById('confirm-modal-confirm-btn');

    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-message').textContent = message;
    confirmBtn.textContent = confirmLabel;

    const close = () => closeModal('confirm-modal');

    modal.querySelectorAll('[data-close-confirm]').forEach(el => {
        el.onclick = close;
    });

    confirmBtn.onclick = () => {
        close();
        onConfirm?.();
    };

    openModal('confirm-modal');
}

async function deleteCalendar(calendarId) {
    showConfirmModal({
        title: window.i18n.t('dashboard.confirmDelete.title'),
        message: window.i18n.t('dashboard.confirmDelete.message'),
        confirmLabel: window.i18n.t('dashboard.confirmDelete.confirmLabel'),
        onConfirm: () => performDeleteCalendar(calendarId)
    });
}

async function performDeleteCalendar(calendarId) {
    try {
        const headers = await getAuthHeaders();
        const response = await fetchFunction(`/.netlify/functions/delete-calendar?id=${calendarId}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) throw new Error('Failed to delete calendar');

        // Remove it directly instead of re-fetching, for the same reason as create:
        // an immediate re-read can still return the just-deleted calendar.
        cachedCalendars = cachedCalendars.filter(cal => cal.id !== calendarId);
        userCalendarCount = cachedCalendars.length;
        if (cachedCalendars.length > 0) {
            renderCalendars(cachedCalendars);
        } else {
            document.getElementById('calendars-list').innerHTML = '';
            document.getElementById('no-calendars')?.classList.remove('hidden');
        }
        showToast(window.i18n.t('dashboard.toast.deleted'));
    } catch (error) {
        console.error('Error deleting calendar:', error);
        showToast(window.i18n.t('dashboard.toast.deleteFailed'));
    }
}

// ===== UTILITY FUNCTIONS =====
function showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.className = 'app-toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('is-visible');

    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => {
        toast.classList.remove('is-visible');
    }, 3000);
}

function copyShareLink(url, calendarId) {
    navigator.clipboard.writeText(url).then(() => {
        showToast(window.i18n.t('common.linkCopied'));
    }).catch(() => {
        prompt(window.i18n.t('dashboard.card.copyPrompt'), url);
    });

    if (calendarId) {
        const row = document.getElementById(`share-link-row-${calendarId}`);
        row?.classList.remove('hidden');
    }
}

// Make functions available globally for onclick handlers
window.copyShareLink = copyShareLink;
window.deleteCalendar = deleteCalendar;
window.openEditParticipantsModal = openEditParticipantsModal;

