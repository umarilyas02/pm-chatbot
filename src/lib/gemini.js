import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const BASE_PROMPT = `You are CreateX AI, an intelligent project management assistant built into the CreateX workspace.

Your capabilities:
- Create, update, and manage tasks from natural language
- Assign tasks to team members
- Set priorities (critical, high, medium, low) and due dates
- Generate sprint summaries and standup reports
- Predict project risks and suggest mitigations
- Answer questions about project progress

Action format rules:
When a user asks you to create a task, respond conversationally AND include a JSON action block at the end of your response in this exact format:
<action>{"type":"create_task","project_id":"<uuid from context or null>","title":"...","priority":"high|medium|low|critical","due_date":"YYYY-MM-DD or null","status":"todo|backlog|in_progress|review|blocked|completed"}</action>

When asked to show tasks, include:
<action>{"type":"list_tasks","filter":"all|overdue|mine|high-priority"}</action>

Important:
- Always use the exact project UUID from the workspace context when the user references a project by name.
- If the user does not mention a project, use null for project_id.
- Keep responses concise, helpful, and professional. Use bullet points for lists.
- Never make up task data — only describe what the user tells you.`

export function buildSystemPrompt(projectContext = '', contextItems = []) {
  let prompt = BASE_PROMPT

  if (contextItems.length) {
    const block = contextItems.map((item) => `• ${item.text}`).join('\n')
    prompt += `

---
SHARED PROJECT MEMORY (${contextItems.length} items — accumulated across all conversations):
${block}
---`
  }

  if (projectContext) {
    prompt += `

---
CURRENT WORKSPACE DATA (use this to answer questions and fill in project_id for actions):
${projectContext}
---`
  }

  return prompt
}

export function getModel(projectContext = '', contextItems = []) {
  return genAI.getGenerativeModel({
    model: process.env.NEXT_PUBLIC_GEMINI_MODEL ?? 'gemini-2.0-flash',
    systemInstruction: buildSystemPrompt(projectContext, contextItems),
  })
}

/**
 * Extracts a brief context item from a Gemini response if it contained a meaningful action.
 * Returns null if nothing worth saving.
 */
export function extractContextItem(aiResponse) {
  const actionMatch = aiResponse.match(/<action>([\s\S]*?)<\/action>/)
  if (!actionMatch) return null
  try {
    const action = JSON.parse(actionMatch[1])
    if (action.type === 'create_task') {
      const parts = [`Created task: "${action.title}"`, `priority: ${action.priority}`]
      if (action.due_date) parts.push(`due: ${action.due_date}`)
      if (action.assignee) parts.push(`assigned to: ${action.assignee}`)
      return parts.join(', ')
    }
  } catch {
    // malformed action — skip
  }
  return null
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
 * Builds a compact project+task context string for the system prompt.
 * @param {Array} projects  - from getProjects()
 * @param {Array} tasks     - from getTasksForAiContext()
 * @param {string} today    - ISO date string
 */
export function buildProjectContext(projects, tasks, today) {
  if (!projects.length && !tasks.length) return ''

  const lines = [`Today's date: ${today}`, '']

  if (projects.length) {
    lines.push(`Projects (${projects.length}):`)
    for (const p of projects) {
      lines.push(`• "${p.name}" [project_id: ${p.id}] — ${p.task_count ?? 0} tasks${p.description ? ` — ${p.description}` : ''}`)
    }
    lines.push('')
  }

  // Group tasks by project
  const byProject = {}
  for (const t of tasks) {
    const key = t.project_id ?? '__none__'
    if (!byProject[key]) byProject[key] = { name: t.project_name ?? null, tasks: [] }
    byProject[key].tasks.push(t)
  }

  if (Object.keys(byProject).length) {
    lines.push('Tasks:')
    for (const [projectId, group] of Object.entries(byProject)) {
      const header = projectId === '__none__'
        ? '[No project]'
        : `[${group.name ?? projectId} | project_id: ${projectId}]`
      lines.push(header)
      for (const t of group.tasks) {
        const due = t.due_date ? `, due ${t.due_date.slice(0, 10)}` : ''
        const overdue = t.due_date && t.due_date.slice(0, 10) < today && t.status !== 'completed' ? ' ⚠ OVERDUE' : ''
        lines.push(`  • [${t.priority.toUpperCase()}] ${t.title} — ${t.status}${due}${overdue}`)
      }
      lines.push('')
    }
  }

  return lines.join('\n').trim()
}

/**
 * Streams a Gemini response. Returns the full text when the stream ends.
 * @param {string} content        - the latest user message
 * @param {Array}  history        - previous messages from DB (excluding current)
 * @param {(chunk: string) => void} onChunk - called with each text chunk
 * @param {string} projectContext - live workspace data string
 * @param {Array}  contextItems   - cross-chat shared memory items
 */
export async function streamChat(content, history, onChunk, projectContext = '', contextItems = []) {
  const model = getModel(projectContext, contextItems)
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
