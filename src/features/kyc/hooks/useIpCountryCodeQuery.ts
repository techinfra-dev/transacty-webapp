import { useQuery } from '@tanstack/react-query'
import { getIpCountryCode } from '../services/geoIpService.ts'

export function useIpCountryCodeQuery(enabled = true) {
  return useQuery({
    queryKey: ['geo-ip-country-code'],
    queryFn: getIpCountryCode,
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 0,
  })
}
