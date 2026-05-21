import { getSession } from '@/lib/session'
import { getProjects } from '@/lib/db'
import ProjectsClient from '@/components/projects/ProjectsClient'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Projects — CreateX' }

export default async function ProjectsPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const projects = await getProjects(session.userId)

  return <ProjectsClient initialProjects={projects} />
}
