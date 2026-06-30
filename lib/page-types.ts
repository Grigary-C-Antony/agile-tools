// Shared page prop types for Next.js App Router
export interface PageProps {
  params: Promise<Record<string, string>>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}
