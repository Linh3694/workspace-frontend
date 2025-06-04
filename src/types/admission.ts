interface ParentFormData {
    fullName: string;
    phone: string;
    email: string;
    relationship: string;
    address: string;
}

interface EntranceTestRecord {
    testDate: string;
    result: 'Đạt' | 'Không đạt';
    note?: string;
}

export interface AdmissionFormData {
    _id?: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    currentClass: string;
    appliedClass: string;
    currentSchool: string;
    ace: string[];
    isChildOfStaff: boolean;
    parents: ParentFormData[];
    howParentLearned: string;
    expectedSemester: string;
    admissionSupport: string;
    notes: string;
    status: string;
    followUpType: string;
    followUpNote: string;
    entranceTests: EntranceTestRecord[];
}

export { type ParentFormData, type EntranceTestRecord }; 