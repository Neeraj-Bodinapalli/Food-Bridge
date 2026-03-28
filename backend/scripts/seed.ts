import dotenv from 'dotenv'
import { hashPassword, hashPhone } from '../src/auth.js'
import { query } from '../src/db.js'

dotenv.config()

const DEMO_PROVIDER = {
  phone: '+919876543210',
  password: 'DemoProvider123',
  name: 'Chennai Demo Kitchen',
  role: 'provider' as const,
}

const DEMO_RECIPIENT = {
  phone: '+919876543211',
  password: 'DemoRecipient123',
  name: 'Chennai Demo Recipient',
  role: 'recipient' as const,
}

/** Approximate centre of Chennai for demo pins */
const CHENNAI = { lat: 13.0827, lng: 80.2707 }

const LISTING_SEEDS: Array<{
  food_type: 'cooked' | 'packaged' | 'produce' | 'bakery'
  description: string
  photo_url: string
  quantity_kg: number
  servings_est: number
  dlat: number
  dlng: number
  allergen_flags: string[]
  safety_note: string
}> = [
  {
    food_type: 'cooked',
    description: 'Vegetable meals from lunch service — still hot, packed in foil trays.',
    photo_url: 'https://picsum.photos/seed/foodbridge1/480/360',
    quantity_kg: 8,
    servings_est: 24,
    dlat: 0.012,
    dlng: 0.008,
    allergen_flags: ['dairy'],
    safety_note: 'Cooked 2h ago, kept warm; refrigeration recommended within 1h of pickup.',
  },
  {
    food_type: 'bakery',
    description: 'Unsold bread and pastries from today’s bake.',
    photo_url: 'https://picsum.photos/seed/foodbridge2/480/360',
    quantity_kg: 3,
    servings_est: 18,
    dlat: -0.009,
    dlng: 0.014,
    allergen_flags: ['gluten', 'eggs'],
    safety_note: 'Room temperature; best consumed today.',
  },
  {
    food_type: 'packaged',
    description: 'Excess rice bags and lentils (sealed packets).',
    photo_url: 'https://picsum.photos/seed/foodbridge3/480/360',
    quantity_kg: 15,
    servings_est: 60,
    dlat: 0.018,
    dlng: -0.011,
    allergen_flags: [],
    safety_note: 'Dry goods, sealed packaging intact.',
  },
  {
    food_type: 'produce',
    description: 'Surplus vegetables from market day — tomatoes, onions, greens.',
    photo_url: 'https://picsum.photos/seed/foodbridge4/480/360',
    quantity_kg: 12,
    servings_est: 30,
    dlat: -0.014,
    dlng: -0.007,
    allergen_flags: [],
    safety_note: 'Refrigerate promptly; washed before packing.',
  },
  {
    food_type: 'cooked',
    description: 'Idli and sambar leftovers (veg), institutional kitchen.',
    photo_url: 'https://picsum.photos/seed/foodbridge5/480/360',
    quantity_kg: 6,
    servings_est: 20,
    dlat: 0.006,
    dlng: -0.019,
    allergen_flags: [],
    safety_note: 'Chilled chain maintained; reheating instructions on box.',
  },
  {
    food_type: 'packaged',
    description: 'Snack boxes — surplus from corporate event, vegetarian.',
    photo_url: 'https://picsum.photos/seed/foodbridge6/480/360',
    quantity_kg: 4,
    servings_est: 15,
    dlat: -0.02,
    dlng: 0.019,
    allergen_flags: ['nuts'],
    safety_note: 'Check allergen labels on individual packs.',
  },
  {
    food_type: 'bakery',
    description: 'Cakes slices unused from celebration order.',
    photo_url: 'https://picsum.photos/seed/foodbridge7/480/360',
    quantity_kg: 2,
    servings_est: 12,
    dlat: 0.022,
    dlng: 0.016,
    allergen_flags: ['gluten', 'dairy'],
    safety_note: 'Contains cream; keep chilled.',
  },
  {
    food_type: 'produce',
    description: 'Bananas and papaya — ripening fast, perfect for NGOs today.',
    photo_url: 'https://picsum.photos/seed/foodbridge8/480/360',
    quantity_kg: 10,
    servings_est: 25,
    dlat: -0.011,
    dlng: 0.022,
    allergen_flags: [],
    safety_note: 'Ambient storage; bruising may be present.',
  },
  {
    food_type: 'cooked',
    description: 'Curd rice and pickle packs (veg) — closing buffet surplus.',
    photo_url: 'https://picsum.photos/seed/foodbridge9/480/360',
    quantity_kg: 5,
    servings_est: 16,
    dlat: 0.015,
    dlng: 0.021,
    allergen_flags: ['dairy'],
    safety_note: 'Cooler bag available at pickup.',
  },
  {
    food_type: 'packaged',
    description: 'Juice cartons near best-by date — still within window.',
    photo_url: 'https://picsum.photos/seed/foodbridge10/480/360',
    quantity_kg: 9,
    servings_est: 36,
    dlat: -0.017,
    dlng: -0.018,
    allergen_flags: [],
    safety_note: 'Sealed tetra packs; store upright.',
  },
]

async function ensureUser(params: {
  role: 'provider' | 'recipient'
  name: string
  phone: string
  password: string
  lat: number
  lng: number
}): Promise<string> {
  const phoneHash = hashPhone(params.phone)
  const existing = await query<{ id: string }>(`SELECT id FROM users WHERE phone_hash = $1`, [phoneHash])
  if (existing.rows[0]) {
    return existing.rows[0].id
  }
  const passwordHash = await hashPassword(params.password)
  const ins = await query<{ id: string }>(
    `INSERT INTO users (role, name, phone_hash, password_hash, location)
     VALUES ($1::user_role, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography)
     RETURNING id`,
    [params.role, params.name, phoneHash, passwordHash, params.lng, params.lat],
  )
  return ins.rows[0].id
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required. Copy backend/.env.example to .env')
    process.exit(1)
  }

  const providerId = await ensureUser({
    ...DEMO_PROVIDER,
    lat: CHENNAI.lat,
    lng: CHENNAI.lng,
  })
  await ensureUser({
    ...DEMO_RECIPIENT,
    lat: CHENNAI.lat + 0.004,
    lng: CHENNAI.lng + 0.004,
  })

  await query(`DELETE FROM listings WHERE provider_id = $1`, [providerId])

  const now = Date.now()
  for (const item of LISTING_SEEDS) {
    const lat = CHENNAI.lat + item.dlat
    const lng = CHENNAI.lng + item.dlng
    const pickupStart = new Date(now + 45 * 60 * 1000)
    const pickupEnd = new Date(now + 4 * 60 * 60 * 1000)
    const expiresAt = new Date(now + 8 * 60 * 60 * 1000)

    await query(
      `INSERT INTO listings (
         provider_id, food_type, description, photo_url, quantity_kg, servings_est,
         pickup_window_start, pickup_window_end, expires_at, location, allergen_flags, safety_note
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         ST_SetSRID(ST_MakePoint($10, $11), 4326)::geography,
         $12, $13
       )`,
      [
        providerId,
        item.food_type,
        item.description,
        item.photo_url,
        item.quantity_kg,
        item.servings_est,
        pickupStart.toISOString(),
        pickupEnd.toISOString(),
        expiresAt.toISOString(),
        lng,
        lat,
        item.allergen_flags,
        item.safety_note,
      ],
    )
  }

  console.log('Seed complete — Chennai demo listings:', LISTING_SEEDS.length)
  console.log('Demo provider login:', DEMO_PROVIDER.phone, '/', DEMO_PROVIDER.password)
  console.log('Demo recipient login:', DEMO_RECIPIENT.phone, '/', DEMO_RECIPIENT.password)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
