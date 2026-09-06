export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'deep_dive';

export interface JournalTurn {
  id: string;
  role: 'user' | 'gemini';
  text: string;
  timestamp: string;
  mode?: ReflectionMode;
}

export interface MoodSentiment {
  label: string; // e.g., 'Peaceful', 'Inspired', 'Grateful', 'Reflective', 'Melancholy', 'Anxious', 'Grounded'
  score?: number; // 1 to 5 scale
  emoji: string; // visual emoji e.g., '🌿', '✨', '☀️', '💭', '🌧️', '⚡', '🌱'
  color: string; // visual hex tone e.g., '#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#64748b'
  summary: string; // brief 1-sentence emotional essence
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  entryText: string;
  mode: ReflectionMode;
  turns: JournalTurn[];
  aiSummary?: string;
  mood?: MoodSentiment;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionResponse {
  reply: string;
  modelUsed: string;
  mode: ReflectionMode;
  mood?: MoodSentiment;
  timestamp: string;
}
