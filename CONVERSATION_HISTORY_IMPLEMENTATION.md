# Conversation History Implementation

## Overview
This document describes the implementation of conversation history context passing to enhance the conversational capabilities of the Ingage AI Agent.

## Problem Statement
Previously, each query was sent to the backend API in isolation without any conversation context:
```typescript
// Old payload
{
  query: "current user question"
}
```

This resulted in the AI agent treating each query independently, leading to less contextual and conversational responses.

## Solution
Modified the `chat.service.ts` to include conversation history in the API request payload:

```typescript
// New payload
{
  query: "current user question",
  conversation_history: [
    { role: "user", content: "previous question" },
    { role: "assistant", content: "previous response" },
    // ... more messages
  ]
}
```

## Implementation Details

### 1. Modified `sendToBackend()` Method
**File**: `src/app/services/chat.service.ts`

**Changes**:
- Added conversation history extraction before sending request
- Updated request payload to include `conversation_history` field

```typescript
private sendToBackend(message: string): void {
  // Get conversation history (excluding the current message we just added)
  const currentMessages = this.chatStateSubject.value.messages;
  const conversationHistory = this.formatConversationHistory(currentMessages);
  
  const requestPayload = {
    query: message,
    conversation_history: conversationHistory
  };

  this.http.post<QueryResponse>(`${this.API_BASE_URL}/query`, requestPayload, {
    withCredentials: true
  })
  // ... rest of the method
}
```

### 2. Added `formatConversationHistory()` Method
**Purpose**: Converts internal `Message[]` format to a simplified format suitable for the backend AI agent.

**Features**:
- **Filters**: Excludes typing indicators and the current message
- **Context Window**: Limits to last 10 messages (5 user-agent exchanges) to keep payload manageable
- **Format**: Converts to `{role: 'user' | 'assistant', content: string}[]` format

```typescript
private formatConversationHistory(messages: Message[]): Array<{role: string, content: string}> {
  // Exclude the last message (current user message) and any typing indicators
  const previousMessages = messages
    .filter(msg => !msg.isTyping)
    .slice(0, -1);
  
  // Limit to last 10 messages (5 exchanges) to keep context manageable
  const contextWindow = 10;
  const recentMessages = previousMessages.slice(-contextWindow);
  
  // Convert to simplified format expected by backend
  return recentMessages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
}
```

## Context Window Strategy

### Why Limit to 10 Messages?
1. **API Payload Size**: Prevents excessively large HTTP requests
2. **LLM Token Limits**: Most LLMs have token limits; keeping context focused improves response quality
3. **Relevance**: Recent messages are more relevant than older ones for most queries
4. **Performance**: Smaller payloads = faster API calls

### Adjusting Context Window
To modify the number of messages included, change the `contextWindow` constant:

```typescript
// For more context (7 exchanges)
const contextWindow = 14;

// For less context (3 exchanges)
const contextWindow = 6;
```

## Message Format

### Frontend Message Structure
```typescript
interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'agent';
  queryResponse?: QueryResponse;
  isTyping?: boolean;
}
```

### API Payload Format
```typescript
{
  query: string;
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

## Backend Considerations

### Required Backend Changes
The backend API (`/query` endpoint) needs to be updated to:

1. **Accept** the new `conversation_history` field in the request payload
2. **Process** conversation history when calling the Fabric AI Skills API
3. **Pass context** to the AI agent/LLM for more contextual responses

### Example Backend Implementation (FastAPI)
```python
from pydantic import BaseModel
from typing import List, Optional

class ConversationMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class QueryRequest(BaseModel):
    query: str
    conversation_history: Optional[List[ConversationMessage]] = []

@app.post("/query")
async def handle_query(request: QueryRequest, session_id: str = Depends(get_session_id)):
    # Extract conversation history
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in request.conversation_history
    ]
    
    # Add current query
    history.append({"role": "user", "content": request.query})
    
    # Call Fabric AI Skills with full conversation context
    result = await call_fabric_ai_agent(
        messages=history,
        fabric_token=session.fabric_token
    )
    
    return {"success": True, "response": result}
```

## Testing

### Test Scenarios

1. **First Message (No History)**
   - User asks: "What is our total revenue?"
   - Payload: `conversation_history: []`
   - Expected: Normal response

2. **Follow-up Question**
   - Previous: "What is our total revenue?" → "$5.2M"
   - User asks: "How does that compare to last year?"
   - Payload: `conversation_history: [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]`
   - Expected: AI understands "that" refers to "$5.2M"

3. **Long Conversation (Context Window Test)**
   - After 10+ messages, verify only last 10 are sent
   - Check payload size remains manageable

4. **Multiple Topics**
   - Conversation switches topics
   - Verify context helps or doesn't confuse responses

### Manual Testing Steps

1. **Start Development Server**
   ```bash
   npm start
   ```

2. **Open Browser DevTools** (Network tab)

3. **Send Test Queries**
   - First query: "Show me sales data"
   - Follow-up: "What about last month?"
   - Verify in Network tab that POST /query includes `conversation_history`

4. **Inspect Payload**
   ```json
   {
     "query": "What about last month?",
     "conversation_history": [
       {
         "role": "user",
         "content": "Show me sales data"
       },
       {
         "role": "assistant",
         "content": "Here is the sales data: ..."
       }
     ]
   }
   ```

## Benefits

### User Experience
- ✅ **Natural Conversations**: Users can ask follow-up questions without repeating context
- ✅ **Pronoun Resolution**: AI understands references like "that", "it", "this"
- ✅ **Topic Continuity**: Multi-turn conversations feel more natural

### Examples

**Before (No Context)**:
- User: "What is our revenue?"
- Agent: "$5.2M total revenue"
- User: "How does it compare to last year?"
- Agent: ❌ "Please specify what you want to compare"

**After (With Context)**:
- User: "What is our revenue?"
- Agent: "$5.2M total revenue"
- User: "How does it compare to last year?"
- Agent: ✅ "Revenue of $5.2M is up 15% from last year's $4.5M"

## Performance Considerations

### API Payload Size
- **Without history**: ~50-200 bytes per request
- **With history (10 messages)**: ~1-5 KB per request
- **Impact**: Negligible for modern networks

### Backend Processing
- Context increases LLM token usage
- May slightly increase response time (100-500ms)
- Improves response quality significantly

## Future Enhancements

### Potential Improvements
1. **Smart Context Selection**
   - Analyze query to determine relevant history
   - Include only contextually relevant messages
   
2. **Summarization**
   - For long conversations, summarize older messages
   - Send summary + recent messages
   
3. **Context Indicators**
   - Show user what context is being used
   - Allow manual context management
   
4. **Session-based Context**
   - Persist context across page refreshes
   - Load conversation history on app start

## Configuration

### Adjustable Parameters

```typescript
// In formatConversationHistory() method
const contextWindow = 10;  // Number of previous messages to include

// To make configurable, move to environment:
// environment.ts
export const environment = {
  // ... other config
  conversationContextWindow: 10
};

// In chat.service.ts
private formatConversationHistory(messages: Message[]): Array<{role: string, content: string}> {
  const contextWindow = environment.conversationContextWindow;
  // ... rest of implementation
}
```

## Rollback Plan

If issues arise, the feature can be easily disabled by reverting the `sendToBackend()` method:

```typescript
// Disable conversation history (rollback)
private sendToBackend(message: string): void {
  const requestPayload = {
    query: message
    // Remove: conversation_history: conversationHistory
  };
  
  // ... rest unchanged
}
```

## Related Files

- **Modified**: `src/app/services/chat.service.ts`
- **Interface**: `src/app/models/chat.models.ts` (unchanged, already compatible)
- **Backend**: API endpoint `/query` (requires update to handle conversation_history)

## Summary

This implementation adds conversation history context to API requests, enabling the AI agent to provide more contextual and conversational responses. The change is backward-compatible (if backend ignores `conversation_history`, it works as before) and includes smart filtering to keep payloads manageable.

**Key Points**:
- ✅ No breaking changes to existing interfaces
- ✅ Context window of 10 messages (configurable)
- ✅ Filters out typing indicators and current message
- ✅ Converts to standard LLM conversation format
- ✅ Backward compatible with backend
- ⚠️ **Backend must be updated to process conversation_history field**
