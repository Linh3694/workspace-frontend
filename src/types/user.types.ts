export interface User {
  _id: string;
  fullname: string;
  email: string;
}

export interface Teacher {
  _id: string;
  fullname: string;
  email: string;
  phone?: string;
  user: User;
}

export interface Student {
  _id: string;
  studentCode: string;
  name: string;
  fullname: string;
} 