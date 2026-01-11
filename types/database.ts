export interface Session {
  id: number
  nickname: string
  clothing_prompt: string
  generated_image_url?: string | null
  created_at: string
}

export interface SessionInsert {
  nickname: string
  clothing_prompt: string
  generated_image_url?: string | null
  created_at?: string
}

export interface Photo {
  id: number
  session_id: number
  filename: string
  filepath: string
  storage_url: string | null
  vton_result_url?: string | null
  timestamp: string
}

export interface PhotoInsert {
  session_id: number
  filename: string
  filepath: string
  storage_url?: string | null
  vton_result_url?: string | null
  timestamp?: string
}

export interface SessionWithPhotos extends Session {
  photos: Photo[]
}

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: Session
        Insert: SessionInsert
        Update: Partial<SessionInsert>
      }
      photos: {
        Row: Photo
        Insert: PhotoInsert
        Update: Partial<PhotoInsert>
      }
    }
  }
}
