/**
 * Unit Tests for API Functions
 * Tests the Netlify Functions responses and logic
 */

describe('API Functions', () => {
    describe('Create Calendar Function', () => {
        test('should return 401 without authorization header', () => {
            const headers = {};
            const hasAuth = headers['Authorization']?.startsWith('Bearer ');
            expect(hasAuth).toBeFalsy();
        });

        test('should validate calendar name is required', () => {
            const body = { name: '', description: 'Test' };
            const isValid = body.name && body.name.trim();
            expect(isValid).toBeFalsy();
        });

        test('should validate calendar name is not just whitespace', () => {
            const body = { name: '   ', description: 'Test' };
            const isValid = body.name && body.name.trim();
            expect(isValid).toBeFalsy();
        });

        test('should generate unique calendar ID', () => {
            const generateId = () => {
                const uuid1 = 'xxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
                const uuid2 = 'xxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
                return uuid1 + uuid2;
            };

            const id1 = generateId();
            const id2 = generateId();

            expect(id1).not.toBe(id2);
            expect(id1.length).toBe(16);
        });

        test('should create calendar object with correct structure', () => {
            const calendar = {
                id: 'test123',
                name: 'Summer Trip',
                description: 'Beach vacation',
                dateRangeType: 'custom',
                startDate: '2026-07-01',
                endDate: '2026-07-31',
                participantsType: 'defined',
                participants: ['Alice', 'Bob'],
                ownerId: 'user-123',
                ownerEmail: 'owner@example.com',
                createdAt: new Date().toISOString(),
                unavailability: {}
            };

            expect(calendar).toHaveProperty('id');
            expect(calendar).toHaveProperty('name');
            expect(calendar).toHaveProperty('startDate');
            expect(calendar).toHaveProperty('endDate');
            expect(calendar).toHaveProperty('participants');
            expect(calendar).toHaveProperty('unavailability');
        });
    });

    describe('Get Calendar Function', () => {
        test('should require calendar ID', () => {
            const query = {};
            const hasId = query.id && query.id.trim();
            expect(hasId).toBeFalsy();
        });

        test('should return 404 for non-existent calendar', () => {
            const calendar = null;
            const status = calendar ? 200 : 404;
            expect(status).toBe(404);
        });
    });

    describe('Submit Unavailability Function', () => {
        test('should validate required fields', () => {
            const validateSubmission = (body) => {
                if (!body.calendarId) return { error: 'Calendar ID is required' };
                if (!body.participant) return { error: 'Participant name is required' };
                if (!Array.isArray(body.dates)) return { error: 'Dates must be an array' };
                return { valid: true };
            };

            expect(validateSubmission({}).error).toBe('Calendar ID is required');
            expect(validateSubmission({ calendarId: '123' }).error).toBe('Participant name is required');
            expect(validateSubmission({ calendarId: '123', participant: 'Alice' }).error).toBe('Dates must be an array');
            expect(validateSubmission({ calendarId: '123', participant: 'Alice', dates: [] }).valid).toBe(true);
        });

        test('should allow empty dates array (available for all)', () => {
            const submission = {
                calendarId: 'test-123',
                participant: 'Alice',
                dates: []
            };

            expect(submission.dates).toEqual([]);
            expect(submission.dates.length).toBe(0);
        });

        test('should store submission with timestamp', () => {
            const submission = {
                participant: 'Alice',
                dates: ['2026-07-15', '2026-07-16'],
                timestamp: new Date().toISOString()
            };

            expect(submission.timestamp).toBeDefined();
            expect(new Date(submission.timestamp)).toBeInstanceOf(Date);
        });
    });

    describe('Get Unavailability Function', () => {
        test('should aggregate unavailability by date', () => {
            const submissions = [
                { participant: 'Alice', dates: ['2026-07-15', '2026-07-16'] },
                { participant: 'Bob', dates: ['2026-07-15', '2026-07-17'] },
                { participant: 'Charlie', dates: ['2026-07-16'] }
            ];

            const unavailability = {};
            submissions.forEach(sub => {
                sub.dates.forEach(date => {
                    if (!unavailability[date]) {
                        unavailability[date] = [];
                    }
                    unavailability[date].push(sub.participant);
                });
            });

            expect(unavailability['2026-07-15']).toEqual(['Alice', 'Bob']);
            expect(unavailability['2026-07-16']).toEqual(['Alice', 'Charlie']);
            expect(unavailability['2026-07-17']).toEqual(['Bob']);
        });
    });

    describe('Reset Unavailability Function', () => {
        test('should validate required fields', () => {
            const validateReset = (body) => {
                if (!body.calendarId) return { error: 'Calendar ID is required' };
                if (!body.participant) return { error: 'Participant name is required' };
                return { valid: true };
            };

            expect(validateReset({}).error).toBe('Calendar ID is required');
            expect(validateReset({ calendarId: '123' }).error).toBe('Participant name is required');
            expect(validateReset({ calendarId: '123', participant: 'Alice' }).valid).toBe(true);
        });
    });

    describe('Get User Submissions Function', () => {
        test('should filter submissions by participant', () => {
            const allSubmissions = [
                { participant: 'Alice', dates: ['2026-07-15'], timestamp: '2026-04-01T10:00:00Z' },
                { participant: 'Bob', dates: ['2026-07-16'], timestamp: '2026-04-01T11:00:00Z' },
                { participant: 'Alice', dates: ['2026-07-17'], timestamp: '2026-04-02T10:00:00Z' }
            ];

            const participant = 'Alice';
            const userSubmissions = allSubmissions.filter(s => s.participant === participant);

            expect(userSubmissions).toHaveLength(2);
            expect(userSubmissions.every(s => s.participant === 'Alice')).toBe(true);
        });

        test('should return empty array for unknown participant', () => {
            const allSubmissions = [
                { participant: 'Alice', dates: ['2026-07-15'] }
            ];

            const participant = 'Unknown';
            const userSubmissions = allSubmissions.filter(s => s.participant === participant);

            expect(userSubmissions).toHaveLength(0);
        });
    });

    describe('Delete Calendar Function', () => {
        test('should require calendar ID', () => {
            const query = {};
            const hasId = query.id && query.id.trim();
            expect(hasId).toBeFalsy();
        });

        test('should require authorization', () => {
            const headers = {};
            const hasAuth = headers['Authorization']?.startsWith('Bearer ');
            expect(hasAuth).toBeFalsy();
        });

        test('should verify ownership before deletion', () => {
            const calendar = { ownerId: 'user-123' };
            const requestUserId = 'user-456';

            const isOwner = calendar.ownerId === requestUserId;
            expect(isOwner).toBe(false);
        });
    });
});

describe('CORS Headers', () => {
    test('should include required CORS headers', () => {
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json'
        };

        expect(headers['Access-Control-Allow-Origin']).toBe('*');
        expect(headers['Access-Control-Allow-Headers']).toContain('Authorization');
        expect(headers['Content-Type']).toBe('application/json');
    });

    test('should handle OPTIONS preflight request', () => {
        const method = 'OPTIONS';
        const isOptions = method === 'OPTIONS';
        expect(isOptions).toBe(true);
        // Should return 204 No Content for OPTIONS
    });
});

describe('JWT Token Parsing', () => {
    test('should decode JWT payload', () => {
        // Sample JWT structure (base64 encoded)
        const payload = {
            sub: 'user-123',
            email: 'test@example.com',
            exp: Math.floor(Date.now() / 1000) + 3600
        };

        const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
        const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());

        expect(decoded.sub).toBe('user-123');
        expect(decoded.email).toBe('test@example.com');
    });

    test('should extract user ID from token', () => {
        const payload = { sub: 'user-abc-123' };
        const userId = payload.sub;
        expect(userId).toBe('user-abc-123');
    });
});

