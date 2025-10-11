export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'agent';
  isTyping?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
}

export interface ApiResponse {
  result?: string;
  answer?: string;
  response?: string;
  error?: boolean;
  message?: string;
}