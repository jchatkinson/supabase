import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { Project } from 'types'
import { projectKeys } from './keys'

export type ProjectDetailVariables = { ref?: string }

export async function getProjectDetail({ ref }: ProjectDetailVariables, signal?: AbortSignal) {
  if (!ref) {
    throw new Error('Project ref is required')
  }

  const data = await get<Project>(`${API_URL}/projects/${ref}`, { signal })

  if (!isResponseOk(data)) {
    throw data.error
  }

  return data
}

export type ProjectDetailData = Awaited<ReturnType<typeof getProjectDetail>>
export type ProjectDetailError = unknown

export const useProjectDetailQuery = <TData = ProjectDetailData>(
  { ref }: ProjectDetailVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectDetailData, ProjectDetailError, TData> = {}
) =>
  useQuery<ProjectDetailData, ProjectDetailError, TData>(
    projectKeys.detail(ref),
    ({ signal }) => getProjectDetail({ ref }, signal),
    {
      enabled: enabled && typeof ref !== 'undefined',
      staleTime: 30 * 1000, // 30 seconds
      ...options,
    }
  )

export const useProjectDetailPrefetch = ({ ref }: ProjectDetailVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (ref) {
      client.prefetchQuery(projectKeys.detail(ref), ({ signal }) =>
        getProjectDetail({ ref }, signal)
      )
    }
  }, [ref])
}
