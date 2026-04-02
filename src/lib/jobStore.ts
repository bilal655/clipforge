import { Job } from './types'

// Simple in-memory store — jobs persist while the server is running.
// For production, swap this with a database (Supabase, PlanetScale, etc.)
const jobs = new Map<string, Job>()

export const jobStore = {
  get(id: string): Job | undefined {
    return jobs.get(id)
  },

  set(id: string, job: Job): void {
    jobs.set(id, job)
  },

  update(id: string, updates: Partial<Job>): Job | null {
    const job = jobs.get(id)
    if (!job) return null
    const updated = { ...job, ...updates }
    jobs.set(id, updated)
    return updated
  },

  all(): Job[] {
    return Array.from(jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  delete(id: string): void {
    jobs.delete(id)
  },
}
