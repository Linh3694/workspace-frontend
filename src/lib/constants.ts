export const SCHOOL_TYPES = {
    PRIMARY: "Tiểu học",
    MIDDLE: "THCS",
    HIGH: "THPT",
} as const;

export type SchoolType = typeof SCHOOL_TYPES[keyof typeof SCHOOL_TYPES];

export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
    [SCHOOL_TYPES.PRIMARY]: "Tiểu học",
    [SCHOOL_TYPES.MIDDLE]: "THCS",
    [SCHOOL_TYPES.HIGH]: "THPT",
};

export const GRADE_LEVEL_RANGES: Record<SchoolType, number[]> = {
    [SCHOOL_TYPES.PRIMARY]: [1, 2, 3, 4, 5],
    [SCHOOL_TYPES.MIDDLE]: [6, 7, 8, 9],
    [SCHOOL_TYPES.HIGH]: [10, 11, 12],
}; 