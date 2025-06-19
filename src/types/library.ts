export interface DocumentType {
  _id: string;
  name: string;
  code: string;
}

export interface SeriesName {
  _id: string;
  name: string;
}

export interface SpecialCode {
  _id: string;
  name: string;
  code: string;
  language: string;
}

export interface Author {
  _id: string;
  name: string;
}

export interface Library {
  _id: string;
  libraryCode: string;
  authors: string[];
  title: string;
  coverImage?: string;
  category: string;
  language: string;
  description: string;
  documentType: string;
  specialCode: string;
  seriesName: string;
}

export interface Book {
  _id?: string;
  generatedCode?: string;
  isbn: string;
  documentIdentifier: string;
  bookTitle: string;
  classificationSign: string;
  publisherPlaceName: string;
  publisherName: string;
  publishYear: number | null;
  pages: number | null;
  attachments: string[];
  documentType: string;
  coverPrice: number | null;
  language: string;
  catalogingAgency: string;
  storageLocation: string;
  seriesName: string;
  specialCode: string;
  status?: string;
  isNewBook?: boolean;
  isFeaturedBook?: boolean;
  isAudioBook?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Thêm interfaces cho library management
export interface LibraryWithBooks extends Library {
  books: BookItem[];
  borrowCount?: number;
}

export interface BookItem {
  _id?: string;
  generatedCode?: string;
  status: "Sẵn sàng" | "Đang mượn" | "Đã đặt trước" | "Quá hạn";
  borrowedStudent?: {
    _id: string;
    fullName?: string;
    name?: string;
  };
  studentEnroll?: {
    classInfo?: {
      className: string;
    };
  };
  returnDate?: string;
}

export interface CartItem {
  libraryId: string;
  libraryTitle: string;
  bookCode: string;
  bookStatus: string;
}

export interface StudentInfo {
  studentId: string;
  studentCode?: string;
  name: string;
  email: string;
  className: string;
  photoUrl: string;
}

export interface StudentSuggestion {
  _id: string;
  studentId: string;
  fullName: string;
  className: string;
  email: string;
  photoUrl?: string;
}

export interface BorrowPayload {
  studentId: string;
  borrowedBooks: {
    libraryId: string;
    bookCode: string;
  }[];
} 