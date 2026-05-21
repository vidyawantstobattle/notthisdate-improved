// ===== NETLIFY IDENTITY SETUP =====
const netlifyIdentity = window.netlifyIdentity;
let currentUser = null;
let participantsTagsInput = null;

// ===== TAGS INPUT CLASS =====
class TagsInput {
    constructor(container, options = {}) {
        this.container = container;
        this.tags = options.initialTags || [];
        this.placeholder = options.placeholder || 'Type a name and press Enter';
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
                ${this.escapeHtml(tag)}
                <button type="button" class="tag-remove" data-index="${index}" aria-label="Remove ${tag}">×</button>
            `;
            this.container.appendChild(tagEl);
        });

        // Add input
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'tags-input';
        this.input.placeholder = this.tags.length === 0 ? this.placeholder : 'Add another...';
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
document.addEventListener('DOMContentLoaded', () => {
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
            if (e.target.value === 'defined') {
                definedParticipants.style.display = 'block';
            } else {
                definedParticipants.style.display = 'none';
            }
        });
    });
}

// Set default dates for the form
function setDefaultDates() {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 2);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');

    if (startInput) startInput.value = formatDate(nextMonth);
    if (endInput) endInput.value = formatDate(endDate);

    // Set min date to today
    if (startInput) startInput.min = formatDate(today);
    if (endInput) endInput.min = formatDate(today);
}

// ===== MODAL FUNCTIONS =====
function openCreateModal() {
    document.getElementById('create-calendar-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeCreateModal() {
    document.getElementById('create-calendar-modal').classList.add('hidden');
    document.body.style.overflow = '';
    document.getElementById('create-calendar-form').reset();
    if (participantsTagsInput) {
        participantsTagsInput.clear();
    }
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

    calendarsList.innerHTML = '<div class="loading-spinner">Loading your calendars...</div>';
    noCalendars.classList.add('hidden');

    try {
        const headers = await getAuthHeaders();
        const response = await fetch('/.netlify/functions/get-calendars', { headers });

        if (!response.ok) throw new Error('Failed to load calendars');

        const data = await response.json();

        if (data.calendars && data.calendars.length > 0) {
            renderCalendars(data.calendars);
        } else {
            calendarsList.innerHTML = '';
            noCalendars.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading calendars:', error);
        calendarsList.innerHTML = '<p class="error-message">Failed to load calendars. Please try again.</p>';
    }
}

function renderCalendars(calendars) {
    const calendarsList = document.getElementById('calendars-list');

    calendarsList.innerHTML = calendars.map(cal => {
        const dateRange = cal.dateRangeType === 'open'
            ? 'Open-ended'
            : `${formatDisplayDate(cal.startDate)} - ${formatDisplayDate(cal.endDate)}`;

        const participantsText = cal.participantsType === 'open'
            ? 'Anyone can join'
            : `${cal.participants?.length || 0} participants`;

        const shareUrl = `${window.location.origin}/c/${cal.id}`;

        return `
            <div class="calendar-card">
                <h3>${escapeHtml(cal.name)}</h3>
                ${cal.description ? `<p class="calendar-card-description">${escapeHtml(cal.description)}</p>` : ''}
                <div class="calendar-card-meta">
                    <span>📅 ${dateRange}</span>
                    <span>👥 ${participantsText}</span>
                </div>
                <div class="calendar-card-actions">
                    <a href="/c/${cal.id}" class="btn btn-primary btn-small">Open</a>
                    <button class="btn btn-outline btn-small" onclick="copyShareLink('${shareUrl}')">Share Link</button>
                    <button class="btn btn-outline btn-small" onclick="deleteCalendar('${cal.id}')">Delete</button>
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
    submitBtn.textContent = 'Creating...';

    const name = document.getElementById('calendar-name').value.trim();
    const description = document.getElementById('calendar-description').value.trim();
    const dateRangeType = document.querySelector('input[name="date-range-type"]:checked').value;
    const participantsType = document.querySelector('input[name="participants-type"]:checked').value;

    let startDate, endDate;
    if (dateRangeType === 'custom') {
        startDate = document.getElementById('start-date').value;
        endDate = document.getElementById('end-date').value;

        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Calendar';
            return;
        }

        if (new Date(endDate) <= new Date(startDate)) {
            alert('End date must be after start date');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Calendar';
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
    if (participantsType === 'defined') {
        participants = participantsTagsInput ? participantsTagsInput.getTags() : [];

        if (participants.length === 0) {
            alert('Please add at least one participant');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Calendar';
            return;
        }
    }

    try {
        const headers = await getAuthHeaders();
        const response = await fetch('/.netlify/functions/create-calendar', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name,
                description,
                dateRangeType,
                startDate,
                endDate,
                participantsType,
                participants
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create calendar');
        }

        const data = await response.json();
        closeCreateModal();
        loadUserCalendars();

        // Show share modal with the link
        showShareModal(data.calendar);
    } catch (error) {
        console.error('Error creating calendar:', error);
        alert('Failed to create calendar: ' + error.message);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Calendar';
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

    // Show different info based on participants type
    if (calendar.participantsType === 'open') {
        participantsInfo.className = 'share-info info-open';
        participantsInfo.innerHTML = `
            <h4>📧 Email Verification Required</h4>
            <p>Anyone with this link can join, but they'll need to verify their email address before adding their unavailable dates. This helps prevent spam and ensures everyone is accountable.</p>
        `;
    } else {
        participantsInfo.className = 'share-info info-defined';
        participantsInfo.innerHTML = `
            <h4>👥 Invite Your Participants</h4>
            <p>Share this link with: <strong>${calendar.participants.join(', ')}</strong>. They'll select their name from a dropdown to submit their unavailable dates - no account needed!</p>
        `;
    }

    shareModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

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
    const shareModal = document.getElementById('share-modal');
    shareModal.classList.add('hidden');
    document.body.style.overflow = '';
}

async function deleteCalendar(calendarId) {
    if (!confirm('Are you sure you want to delete this calendar? This cannot be undone.')) {
        return;
    }

    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/.netlify/functions/delete-calendar?id=${calendarId}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) throw new Error('Failed to delete calendar');

        // Refresh the calendar list
        await loadUserCalendars();
    } catch (error) {
        console.error('Error deleting calendar:', error);
        alert('Failed to delete calendar. Please try again.');
    }
}

// ===== UTILITY FUNCTIONS =====
function copyShareLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
    }).catch(() => {
        prompt('Copy this link:', url);
    });
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally for onclick handlers
window.copyShareLink = copyShareLink;
window.deleteCalendar = deleteCalendar;

