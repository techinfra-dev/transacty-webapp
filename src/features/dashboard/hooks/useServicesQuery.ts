import { useQuery } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { getPortalServices } from '../services/servicesService.ts'

export function useServicesQuery(enabled = true) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: ['portal', 'services', environment],
    queryFn: () => getPortalServices(environment),
    enabled,
  })
}
