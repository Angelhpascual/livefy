import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import sharp from 'sharp'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB input (se comprimirá)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato no válido. Usa JPEG, PNG, WebP o HEIC.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Imagen demasiado grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    // Convierte siempre a WebP — mejor compresión para screenshots de tablaturas
    // lossless:true preserva texto nítido sin artefactos de compresión
    const webpBuffer = await sharp(inputBuffer)
      .webp({ lossless: true, effort: 6 })
      .toBuffer()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )

    const filename = `${crypto.randomUUID()}.webp`

    const { error } = await supabase.storage
      .from('song-images')
      .upload(filename, webpBuffer, { contentType: 'image/webp' })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('song-images')
      .getPublicUrl(filename)

    return NextResponse.json({ url: urlData.publicUrl }, { status: 201 })
  } catch (error) {
    console.error('POST /api/songs/upload error:', error)
    return NextResponse.json({ error: 'Error subiendo la imagen' }, { status: 500 })
  }
}
