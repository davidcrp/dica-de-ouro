export async function POST(req: Request) {
  const { nome, endereco } = await req.json()
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) return Response.json({ error: 'Google Places API key não configurada' }, { status: 500 })

  const query = encodeURIComponent(`${nome} ${endereco} Ouro Preto MG Brasil`)
  const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,name,opening_hours,photos,formatted_phone_number,website,rating&key=${apiKey}`

  const searchRes = await fetch(searchUrl)
  const searchData = await searchRes.json()
  const place = searchData.candidates?.[0]
  if (!place) return Response.json({ horario: null, foto: null, rating: null })

  const horario = place.opening_hours?.weekday_text?.join(', ') || null
  const fotoRef = place.photos?.[0]?.photo_reference || null
  const foto = fotoRef
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${fotoRef}&key=${apiKey}`
    : null

  return Response.json({
    horario,
    foto,
    rating: place.rating || null,
    telefone: place.formatted_phone_number || null,
    site: place.website || null,
  })
}
