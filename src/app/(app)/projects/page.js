import { getSession } from '@/lib/session'
import { getProjects, getWorkspaceProjects, getPrimaryWorkspace } from '@/lib/db'
import ProjectsClient from '@/components/projects/ProjectsClient'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Projects — CreateX' }

export default async function ProjectsPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const workspace = await getPrimaryWorkspace(session.userId)
  const isOwner = workspace?.owner_id === session.userId

  const projects = workspace
    ? isOwner
      ? await getProjects(session.userId)
      : await getWorkspaceProjects(workspace.id)
    : []

  return <ProjectsClient initialProjects={projects} isOwner={isOwner} />
}
