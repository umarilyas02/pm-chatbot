import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const SYSTEM_PROMPT = `You are CreateX AI, an intelligent project management assistant built into the CreateX workspace.

Your capabilities:
- Create, update, and manage tasks from natural language
- Assign tasks to team members
- Set priorities (critical, high, medium, low) and due dates
- Generate sprint summaries and standup reports
- Predict project risks and suggest mitigations
- Answer questions about project progress

When a user asks you to create a task, respond conversationally AND include a JSON action block at the end of your response in this exact format:
<action>{"type":"create_task","title":"...","priority":"high|medium|low|critical","due_date":"YYYY-MM-DD or null","assignee":"name or null"}</action>

When asked to show tasks, include:
<action>{"type":"list_tasks","filter":"all|overdue|mine|high-priority"}</action>

Keep responses concise, helpful, and professional. Use bullet points for lists.
Never make up task data — only describe what the user tells you.`

export function getModel() {
  return genAI.getGenerativeModel({
    model: process.env.NEXT_PUBLIC_GEMINI_MODEL ?? 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  })
}

/**
 * Converts DB messages to the Gemini history format.
 * Gemini history excludes the last user message (that's sent separately).
 */
export function toGeminiHistory(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

/**
 * Streams a Gemini response. Returns the full text when the stream ends.
 * @param {string} content - the latest user message
 * @param {Array}  history - previous messages from DB (excluding current)
 * @param {(chunk: string) => void} onChunk - called with each text chunk
 */
export async function streamChat(content, history, onChunk) {
  const model = getModel()
  const chat = model.startChat({ history: toGeminiHistory(history) })
  const result = await chat.sendMessageStream(content)

  let full = ''
  for await (const chunk of result.stream) {
    const text = chunk.text()
    full += text
    onChunk(text)
  }
  return full
}
