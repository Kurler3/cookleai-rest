


export const RESET_FREQUENCY = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY', 
    NONE: 'NONE',
};

export const DEFAULT_QUOTAS = {
    AI: {
        limit: 3,
        isResettable: true,
        resetFrequency: RESET_FREQUENCY.DAILY,
    }
}

export const QUOTA_TYPES = {
    AI: 'AI',
}