import axios from 'axios';
import { UploadDocumentResponse, QueryResponse, Document } from '@documind/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadDocument = async (file: File): Promise<UploadDocumentResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadDocumentResponse>('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const queryDocuments = async (question: string, topK: number = 5): Promise<QueryResponse> => {
  const response = await apiClient.post<QueryResponse>('/query', {
    question,
    topK,
  });

  return response.data;
};

export const getDocuments = async (): Promise<Document[]> => {
  const response = await apiClient.get<Document[]>('/documents');
  return response.data;
};
