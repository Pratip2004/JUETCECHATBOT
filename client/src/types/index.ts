export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  images?: string[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface ChatSession {
  id: string;
  title: string;
  subject?: string;
  semester?: Semester;
  year?: Year;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  year: Year;
  semester: Semester;
}

export type Semester = '1' | '2';
export type Year = '1' | '2' | '3' | '4';

export interface FormErrors {
  [key: string]: string;
}