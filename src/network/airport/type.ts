export interface RawAirport {
  city: string;
  country: string;
  elevation: string;
  iata: string;
  icao: string;
  lat: string;
  lid: string;
  lon: string;
  name: string;
  subd: string;
  tz: string;
}

export interface Airport {
  latitude: number
  longitude: number
  icao: string
  iata: string
  name: string
  city: string
  country: string
  elevation: string
  subd: string
  tz: string
  lid: string
}
