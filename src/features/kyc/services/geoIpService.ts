interface GeoIpResponse {
  country_code?: string
  countryCode?: string
}

export async function getIpCountryCode() {
  const response = await fetch('https://ipapi.co/json/')
  if (!response.ok) {
    throw new Error('Unable to detect location from IP')
  }

  const payload = (await response.json()) as GeoIpResponse
  const countryCode = payload.country_code ?? payload.countryCode ?? ''
  return countryCode.toUpperCase()
}
