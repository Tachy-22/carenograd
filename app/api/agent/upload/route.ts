import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ message: 'Authorization header required' }, { status: 401 })
    }

    // Get the FormData from the request
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ message: 'Only PDF files are supported' }, { status: 400 })
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'File too large. Maximum size is 50MB' }, { status: 400 })
    }

    // Create new FormData for backend request
    const backendFormData = new FormData()
    backendFormData.append('file', file)

    // Forward request to backend
    const backendResponse = await fetch('http://localhost:3000/agent/upload', {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: backendFormData
    })

    const result = await backendResponse.json()

    // Return the backend response
    return NextResponse.json(result, { status: backendResponse.status })

  } catch (error) {
    console.error('Upload proxy error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}