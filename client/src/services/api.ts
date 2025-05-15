import { api } from '../context/AuthContext';

export interface ChatResponse {
  answer: string;
  images: string[];
}

export const startChat = async (
  question: string,
  sessionId: string,
  year: string,
  semester: string,
  subject: string
): Promise<ChatResponse> => {
  const response = await api.post('/start_chat', {
    question,
    session_id: sessionId,
    year,
    semester,
    subject
  });
  return response.data;
};

export const multimodalChat = async (
  question: string,
  sessionId: string,
  year: string,
  semester: string,
  subject: string,
  file: File
): Promise<ChatResponse> => {
  const formData = new FormData();
  formData.append('question', question);
  formData.append('session_id', sessionId);
  formData.append('year', year);
  formData.append('semester', semester);
  formData.append('subject', subject);
  formData.append('file', file);

  const response = await api.post('/multimodal_chat', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}; 