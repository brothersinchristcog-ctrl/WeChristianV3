export interface EventDraft {
  title?: string;
  eventType?: string;
  startDateTime?: string;
  endDateTime?: string;
  durationMinutes?: number;
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
  isReadyForConfirmation?: boolean;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `
You are an AI Church Secretary assisting a pastor in creating a church event.
Your goal is to gather all information required to create an event naturally.

Required fields:
- title
- eventType
- startDateTime
- endDateTime
- venueName / address

Optional fields:
- notes

Rules:
1. Ask only ONE question at a time.
2. Do not ask for information already known or inferred.
3. Keep your questions very short and conversational.
4. Calculate 'durationMinutes' from start and end times if both are provided.
5. Continuously use the 'updateDraftEvent' tool to save any extracted information.
6. When all required fields are collected, summarize the event, set 'isReadyForConfirmation' to true, and ask for final confirmation. Do NOT call the tool again if nothing changed.
`;

export const sendToClaude = async (
  messages: Message[],
  onToolCall: (draftUpdate: Partial<EventDraft>) => void
): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key is missing');
  }

  // Format messages for Anthropic
  const formattedMessages: any[] = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const makeRequest = async (msgs: any[]) => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: msgs,
          tools: [
            {
              name: 'updateDraftEvent',
              description: 'Updates the draft event with any newly extracted information.',
              input_schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  eventType: { type: 'string' },
                  startDateTime: { type: 'string', description: 'ISO 8601 format e.g. 2026-06-20T18:00:00' },
                  endDateTime: { type: 'string', description: 'ISO 8601 format' },
                  durationMinutes: { type: 'number' },
                  venueName: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  country: { type: 'string' },
                  notes: { type: 'string' },
                  isReadyForConfirmation: { type: 'boolean' }
                }
              }
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Anthropic API error:', errorText);
        throw new Error(`Failed to fetch from Anthropic: ${response.status}`);
      }

      return await response.json();
    };

    let data = await makeRequest(formattedMessages);
    let textResponse = '';
    let hasToolUse = false;
    let toolUses: any[] = [];

    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') {
          textResponse += block.text;
        } else if (block.type === 'tool_use' && block.name === 'updateDraftEvent') {
          hasToolUse = true;
          toolUses.push(block);
          onToolCall(block.input);
        }
      }
    }

    if (hasToolUse) {
      // Append the assistant's message exactly as is
      formattedMessages.push({ role: 'assistant', content: data.content });

      // Create the tool_result message
      const toolResults = toolUses.map(tool => ({
        type: 'tool_result',
        tool_use_id: tool.id,
        content: 'Draft updated successfully. Please ask the next missing required field.'
      }));

      formattedMessages.push({ role: 'user', content: toolResults });

      // Make the second request to get the actual conversational question!
      const secondData = await makeRequest(formattedMessages);
      
      if (secondData.content) {
        for (const block of secondData.content) {
          if (block.type === 'text') {
            textResponse += block.text;
          }
        }
      }
    }

    return textResponse || 'Got it! What else?';
  } catch (error) {
    console.error('Error communicating with Claude:', error);
    throw error;
  }
};
