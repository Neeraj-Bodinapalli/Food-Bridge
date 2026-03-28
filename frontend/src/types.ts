export type Listing = {
  id: string
  provider_id: string
  food_type: string
  description: string | null
  photo_url: string | null
  quantity_kg: string | null
  servings_est: number | null
  pickup_window_start: string
  pickup_window_end: string
  expires_at: string
  status: string
  allergen_flags: string[]
  safety_note: string | null
  created_at: string
  lat: number
  lng: number
  distance_m?: string
  provider_name?: string
}

export type User = {
  id: string
  role: string
  name: string
  rating_avg?: string
  created_at?: string
}
