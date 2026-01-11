'use client'

import { useRef, useState, useEffect } from 'react'
import type { Session, Photo } from '@/types/database'

type AppState = 'start' | 'form' | 'camera' | 'result' | 'gallery'

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [appState, setAppState] = useState<AppState>('start')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  
  // フォーム入力
  const [nickname, setNickname] = useState('')
  const [clothingPrompt, setClothingPrompt] = useState('')
  const [fullPrompt, setFullPrompt] = useState('') // 完全な英語プロンプトを保存
  const [showPromptEditor, setShowPromptEditor] = useState(false) // プロンプト編集表示切替
  
  // 撮影関連
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' }>()
  const [isLoading, setIsLoading] = useState(false)
  
  // 画像生成関連
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Virtual Try-on関連
  const [tryonResult, setTryonResult] = useState<string | null>(null)
  const [isTryingOn, setIsTryingOn] = useState(false)
  
  // ギャラリー
  const [photos, setPhotos] = useState<Photo[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  
  // モーダル表示用
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  // メッセージを表示
  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(undefined), 3000)
  }

  // セッションを作成
  const createSession = async () => {
    if (!nickname.trim() || !clothingPrompt.trim()) {
      showMessage('ニックネームと服装プロンプトを入力してください。', 'error')
      return
    }

    // fullPromptが空の場合は生成
    if (!fullPrompt.trim()) {
      generatePromptFromJapanese(clothingPrompt)
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          clothing_prompt: clothingPrompt.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        setCurrentSession(result.session)
        showMessage('セッションが作成されました！', 'success')
        setAppState('camera')
        
        // カメラを自動起動
        setTimeout(() => startCamera(), 500)
        
        // 画像生成を自動的に開始
        setTimeout(() => {
          autoGenerateImage(result.session)
        }, 1000)
      } else {
        showMessage(`エラー: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('セッション作成エラー:', error)
      showMessage('セッションの作成に失敗しました。', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // 画像を自動生成（セッション作成時）- Flux Schnell使用
  const autoGenerateImage = async (session: Session) => {
    setIsGenerating(true)
    showMessage('Flux Schnellで画像を生成中...5-10秒ほどお待ちください', 'info')

    try {
      // プロンプトの準備（fullPromptがあればそれを使用、なければclothing_promptを使用）
      const promptToUse = fullPrompt || session.clothing_prompt
      
      console.log('🎨 AI画像生成に使用するプロンプト:', promptToUse)
      console.log('📝 fullPrompt:', fullPrompt)
      console.log('📝 session.clothing_prompt:', session.clothing_prompt)
      
      const response = await fetch('/api/generate-image-flux', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clothing_prompt: promptToUse,
          session_id: session.id
        })
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedImageUrl(result.image_url)
        showMessage('画像が生成されました！参考にして撮影してください', 'success')
      } else {
        console.error('画像生成エラー:', result.error)
        showMessage('画像生成に失敗しました。手動で再試行できます。', 'error')
      }
    } catch (error) {
      console.error('画像生成エラー:', error)
      showMessage('画像生成に失敗しました。手動で再試行できます。', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  // 手動で画像を再生成（プロンプト編集後）
  const regenerateImage = async () => {
    if (!currentSession || !fullPrompt.trim()) {
      showMessage('プロンプトを入力してください', 'error')
      return
    }

    setIsGenerating(true)
    showMessage('画像を再生成中...', 'info')

    try {
      const response = await fetch('/api/generate-image-flux', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clothing_prompt: fullPrompt,
          session_id: currentSession.id
        })
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedImageUrl(result.image_url)
        showMessage('画像が再生成されました！', 'success')
      } else {
        console.error('画像生成エラー:', result.error)
        showMessage('画像生成に失敗しました', 'error')
      }
    } catch (error) {
      console.error('画像生成エラー:', error)
      showMessage('画像生成に失敗しました', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  // 日本語プロンプトをシンプルな英語テンプレートに変換
  const generatePromptFromJapanese = (japaneseText: string) => {
    if (!japaneseText.trim()) {
      setFullPrompt('')
      return
    }
    
    const englishPrompt = `A high-quality product photo with [${japaneseText}] positioned alone in the center of the frame.
The clothing is not being worn and is beautifully laid flat in an arrangement suitable for an online shopping product page.
Background is completely solid white.
Professional studio lighting with soft, even illumination that clearly shows wrinkles, stitching, fabric texture and details.
Minimal shadows, clean aesthetic, minimal and commercial e-commerce catalog photo style.
Do not include any accessories, people, text, or decorations.`
    setFullPrompt(englishPrompt)
  }

  // カメラを起動
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },  // 横向きに戻す
          height: { ideal: 720 },   // 横向きに戻す
          facingMode: 'user'
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setStream(mediaStream)
      showMessage('カメラが起動しました！', 'success')
    } catch (error) {
      console.error('カメラの起動に失敗:', error)
      showMessage('カメラの起動に失敗しました。カメラへのアクセスを許可してください。', 'error')
    }
  }

  // カメラを停止
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setStream(null)
      showMessage('カメラを停止しました。', 'info')
    }
  }

  // 写真を撮影
  const capturePhoto = async () => {
    console.log('📸 撮影開始')
    console.log('🎥 stream:', stream ? '存在' : 'なし')
    console.log('📹 videoRef:', videoRef.current ? '存在' : 'なし')
    console.log('🖼️ canvasRef:', canvasRef.current ? '存在' : 'なし')
    console.log('📋 currentSession:', currentSession?.id)
    
    if (!stream || !videoRef.current || !canvasRef.current || !currentSession) {
      showMessage('カメラが起動していません。', 'error')
      return
    }

    setIsLoading(true)
    const video = videoRef.current
    const canvas = canvasRef.current

    // キャンバスのサイズをビデオに合わせる
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // ビデオフレームをキャンバスに描画
    const context = canvas.getContext('2d')
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
    }

    // キャンバスから画像データを取得
    const imageData = canvas.toDataURL('image/png')
    setCapturedImage(imageData)
    console.log('✅ 画像データ取得完了')

    // カメラを停止
    stopCamera()

    showMessage('写真を撮影しました。データベースに保存中...', 'info')

    // サーバーに送信
    try {
      console.log('📡 画像をアップロード中...')
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageData,
          session_id: currentSession.id
        })
      })

      const result = await response.json()
      console.log('📥 アップロード結果:', result)

      if (result.success) {
        showMessage('写真がデータベースに保存されました！', 'success')
        console.log('✅ 保存成功、ギャラリー更新中...')
        loadPhotos() // ギャラリーを更新
        
        // 自動的にVTON処理を開始（画像データを直接渡す）
        console.log('⏰ 500ms後にVTON処理を開始します...')
        setTimeout(() => {
          console.log('🚀 autoApplyTryon呼び出し')
          console.log('📸 imageData渡す:', imageData ? '存在' : 'なし')
          console.log('👔 generatedImageUrl:', generatedImageUrl ? '存在' : 'なし')
          autoApplyTryon(imageData, generatedImageUrl || undefined)
        }, 500)
      } else {
        showMessage(`保存に失敗しました: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('アップロードエラー:', error)
      showMessage('サーバーへの送信に失敗しました。', 'error')
    } finally {
      setIsLoading(false)
      console.log('🏁 撮影処理終了')
    }
  }

  // 写真を読み込む
  const loadPhotos = async () => {
    try {
      const response = await fetch('/api/photos')
      const data = await response.json()

      if (data.photos) {
        setPhotos(data.photos)
      }
    } catch (error) {
      console.error('ギャラリー読み込みエラー:', error)
    }
  }

  // セッション一覧を読み込む
  const loadSessions = async () => {
    try {
      const response = await fetch('/api/session')
      const data = await response.json()

      if (data.sessions) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('セッション読み込みエラー:', error)
    }
  }

  // 新しいセッションを開始
  const startNewSession = () => {
    stopCamera()
    setCurrentSession(null)
    setNickname('')
    setClothingPrompt('')
    setCapturedImage(null)
    setGeneratedImageUrl(null)
    setAppState('form')
  }

  // 画像を生成 - Flux Schnell使用
  const generateImage = async () => {
    if (!currentSession) return

    // fullPromptが空の場合は元のプロンプトを使用
    const promptToUse = fullPrompt.trim() || currentSession.clothing_prompt

    console.log('🔄 再生成に使用するプロンプト:', promptToUse)
    console.log('📝 fullPrompt:', fullPrompt)
    console.log('📝 session.clothing_prompt:', currentSession.clothing_prompt)

    setIsGenerating(true)
    showMessage('Flux Schnellで画像を生成中...', 'info')

    try {
      const response = await fetch('/api/generate-image-flux', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clothing_prompt: promptToUse,
          session_id: currentSession.id
        })
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedImageUrl(result.image_url)
        showMessage('画像が生成されました！', 'success')
      } else {
        showMessage(`エラー: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('画像生成エラー:', error)
      showMessage('画像の生成に失敗しました。', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  // ギャラリーを表示
  const showGallery = () => {
    stopCamera()
    setAppState('gallery')
    loadPhotos()
    loadSessions()
  }

  // 画像のアスペクト比を元に戻す処理
  const adjustImageAspectRatio = async (vtonImageUrl: string, originalImageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const vtonImg = new Image()
      const originalImg = new Image()
      
      vtonImg.crossOrigin = 'anonymous'
      originalImg.crossOrigin = 'anonymous'
      
      let vtonLoaded = false
      let originalLoaded = false
      
      const checkBothLoaded = () => {
        if (vtonLoaded && originalLoaded) {
          try {
            // 元の画像のアスペクト比を計算
            const originalAspectRatio = originalImg.width / originalImg.height
            
            // キャンバスを元の画像と同じアスペクト比で作成
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
              reject(new Error('Canvas context not available'))
              return
            }
            
            // キャンバスサイズを設定（横向きの場合は横長に）
            if (originalAspectRatio > 1) {
              // 横向き
              canvas.width = 1024
              canvas.height = Math.round(1024 / originalAspectRatio)
            } else {
              // 縦向き
              canvas.height = 1024
              canvas.width = Math.round(1024 * originalAspectRatio)
            }
            
            // VTON画像をキャンバスに描画（アスペクト比を維持してフィット）
            ctx.fillStyle = '#000000'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // VTON画像のアスペクト比
            const vtonAspectRatio = vtonImg.width / vtonImg.height
            
            let drawWidth = canvas.width
            let drawHeight = canvas.height
            let offsetX = 0
            let offsetY = 0
            
            // アスペクト比を維持しながら、キャンバスに収まるようにサイズ調整
            if (vtonAspectRatio > originalAspectRatio) {
              // VTON画像の方が横長 → 幅を基準に
              drawWidth = canvas.width
              drawHeight = drawWidth / vtonAspectRatio
              offsetY = (canvas.height - drawHeight) / 2
            } else {
              // VTON画像の方が縦長 → 高さを基準に
              drawHeight = canvas.height
              drawWidth = drawHeight * vtonAspectRatio
              offsetX = (canvas.width - drawWidth) / 2
            }
            
            ctx.drawImage(vtonImg, offsetX, offsetY, drawWidth, drawHeight)
            
            // 結果をData URLとして返す
            resolve(canvas.toDataURL('image/png'))
          } catch (error) {
            reject(error)
          }
        }
      }
      
      vtonImg.onload = () => {
        vtonLoaded = true
        checkBothLoaded()
      }
      
      originalImg.onload = () => {
        originalLoaded = true
        checkBothLoaded()
      }
      
      vtonImg.onerror = () => reject(new Error('VTON画像の読み込みに失敗しました'))
      originalImg.onerror = () => reject(new Error('元画像の読み込みに失敗しました'))
      
      vtonImg.src = vtonImageUrl
      originalImg.src = originalImageUrl
    })
  }

  // Virtual Try-onを実行
  const applyTryon = async () => {
    if (!capturedImage || !generatedImageUrl) {
      showMessage('写真と生成画像の両方が必要です', 'error')
      return
    }

    setIsTryingOn(true)
    showMessage('Virtual Try-onを実行中...30-60秒ほどお待ちください', 'info')

    try {
      const response = await fetch('/api/virtual-tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personImage: capturedImage,
          garmentImage: generatedImageUrl
        })
      })

      const result = await response.json()

      if (result.success) {
        // 出力画像のアスペクト比を元の撮影画像に合わせて調整
        showMessage('画像のアスペクト比を調整中...', 'info')
        const adjustedImage = await adjustImageAspectRatio(result.resultImage, capturedImage)
        setTryonResult(adjustedImage)
        showMessage('Virtual Try-on完了！', 'success')
      } else {
        console.error('Virtual Try-onエラー:', result.error)
        showMessage(`エラー: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Virtual Try-onエラー:', error)
      showMessage('Virtual Try-onに失敗しました', 'error')
    } finally {
      setIsTryingOn(false)
    }
  }

  // 自動Virtual Try-on実行（撮影後）
  const autoApplyTryon = async (personImageData?: string, garmentImageData?: string) => {
    // 引数で渡された画像データを優先、なければstateから取得
    const personImage = personImageData || capturedImage
    const garmentImage = garmentImageData || generatedImageUrl
    
    console.log('🔄 autoApplyTryon開始')
    console.log('📸 personImage:', personImage ? '存在' : 'なし')
    console.log('👔 garmentImage:', garmentImage ? '存在' : 'なし')
    console.log('📋 currentSession:', currentSession?.id)
    
    if (!personImage || !garmentImage) {
      console.error('❌ 画像の準備ができていません', { personImage: !!personImage, garmentImage: !!garmentImage })
      showMessage('画像の準備ができていません', 'error')
      return
    }

    setIsTryingOn(true)
    showMessage('AIによる着せ替え処理を開始します...', 'info')
    console.log('✅ VTON処理開始')

    try {
      console.log('📡 VTONリクエスト送信中...')
      const response = await fetch('/api/virtual-tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personImage: personImage,
          garmentImage: garmentImage,
          session_id: currentSession?.id
        })
      })

      console.log('📥 VTONレスポンス受信:', response.status)
      const result = await response.json()
      console.log('📦 VTONレスポンスデータ:', result)

      if (result.success) {
        showMessage('画像のアスペクト比を調整中...', 'info')
        console.log('🖼️ アスペクト比調整開始')
        const adjustedImage = await adjustImageAspectRatio(result.resultImage, personImage)
        console.log('✅ アスペクト比調整完了')
        setTryonResult(adjustedImage)
        
        // VTON結果をデータベースに保存
        console.log('💾 VTON結果を保存中...')
        await saveTryonResult(adjustedImage)
        
        // 結果画面に遷移
        console.log('🎉 結果画面に遷移')
        setAppState('result')
        showMessage('着せ替え完了！', 'success')
      } else {
        console.error('❌ Virtual Try-onエラー:', result.error)
        showMessage(`エラー: ${result.error}`, 'error')
        setAppState('result') // エラーでも結果画面に遷移
      }
    } catch (error) {
      console.error('❌ Virtual Try-onエラー:', error)
      showMessage('Virtual Try-onに失敗しました', 'error')
      setAppState('result') // エラーでも結果画面に遷移
    } finally {
      setIsTryingOn(false)
      console.log('🏁 autoApplyTryon終了')
    }
  }

  // VTON結果を保存
  const saveTryonResult = async (vtonImageUrl: string) => {
    if (!currentSession) return

    try {
      // 最新のphotoレコードを更新
      const response = await fetch('/api/photos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: currentSession.id,
          vton_result_url: vtonImageUrl
        })
      })

      const result = await response.json()
      if (result.success) {
        console.log('VTON結果を保存しました')
        loadPhotos() // ギャラリーを更新
      }
    } catch (error) {
      console.error('VTON結果の保存エラー:', error)
    }
  }

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && appState === 'camera' && stream && !isLoading) {
        e.preventDefault()
        capturePhoto()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [appState, stream, isLoading])

  // ページを離れる前にカメラを停止
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  return (
    <div className="min-h-screen p-5 hex-pattern relative overflow-hidden">
      {/* 背景アニメーション */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* ヘッダー */}
        <header className="text-center mb-10 glass-morphism-dark p-8 rounded-3xl neon-border relative overflow-hidden">
          <div className="scanline"></div>
          <h1 className="text-5xl font-bold mb-3 neon-text-cyan tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            ⚡ CYBER FASHION LAB
          </h1>
          <p className="text-lg text-cyan-100" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            AI-Powered Virtual Try-on System v2.0
          </p>
        </header>

        <main className="glass-morphism rounded-3xl p-8 neon-border shadow-2xl backdrop-blur-xl">
          {/* メッセージ */}
          {message && (
            <div
              className={`text-center p-4 rounded-xl font-medium mb-6 glass-morphism-dark ${
                message.type === 'success'
                  ? 'neon-border-green text-green-300'
                  : message.type === 'error'
                  ? 'neon-border-pink text-red-300'
                  : 'neon-border-cyan text-cyan-300'
              }`}
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              {message.text}
            </div>
          )}

          {/* スタート画面 */}
          {appState === 'start' && (
            <div className="text-center py-20 relative hex-pattern">
              <div className="mb-12 relative">
                <div className="text-9xl inline-block relative">
                  <span className="absolute inset-0 blur-2xl opacity-50 text-cyan-400">📸</span>
                  <span className="relative">📸</span>
                </div>
              </div>
              <h2 className="text-5xl font-bold neon-text-cyan mb-8 tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                VIRTUAL TRY-ON
              </h2>
              <div className="glass-morphism max-w-2xl mx-auto p-8 rounded-3xl mb-12 neon-border-cyan">
                <p className="text-xl text-cyan-100 mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  次世代AI着せ替えシステム
                </p>
                <p className="text-sm text-gray-400">
                  ニックネームと服装のプロンプトを入力して、<br />
                  AIが生成する未来の着せ替え体験を
                </p>
              </div>
              <button
                onClick={() => setAppState('form')}
                className="px-16 py-6 cyber-gradient-cyan text-white rounded-2xl font-bold text-xl shadow-2xl neon-border-cyan hover:scale-105 transition-all duration-300 pulse-glow relative overflow-hidden group"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span className="text-2xl">▶</span>
                  <span>システム起動</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-pulse"></div>
              </button>
            </div>
          )}

          {/* フォーム画面 */}
          {appState === 'form' && (
            <div className="max-w-2xl mx-auto py-10">
              <h2 className="text-4xl font-bold neon-text-cyan mb-8 text-center tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                システム設定
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-cyan-300 mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    👤 ニックネーム
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="例: Yuki"
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-500 focus:outline-none transition-colors"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-cyan-300 mb-3 drop-shadow-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    👔 服装の説明（英語のみ）
                  </label>
                  <textarea
                    value={clothingPrompt}
                    onChange={(e) => {
                      const value = e.target.value
                      setClothingPrompt(value)
                      // シンプルなテンプレートで英語プロンプト生成
                      generatePromptFromJapanese(value)
                    }}
                    placeholder="例: red dress, white shirt with jeans, など"
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-500 focus:outline-none transition-colors resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-cyan-200" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      {clothingPrompt.length} / 200文字
                    </p>
                  </div>
                </div>

                {/* プロンプト編集オプション */}
                <div className="border-t border-cyan-800 pt-4">
                  <button
                    onClick={() => setShowPromptEditor(!showPromptEditor)}
                    className="text-sm text-cyan-300 hover:text-cyan-100 font-medium flex items-center gap-2 drop-shadow-lg"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    {showPromptEditor ? '▼' : '▶'} 詳細プロンプトを編集（英語）
                  </button>
                  
                  {showPromptEditor && (
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-cyan-300 mb-2 drop-shadow-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        🎨 完全なAIプロンプト（英語）
                      </label>
                      <textarea
                        value={fullPrompt}
                        onChange={(e) => setFullPrompt(e.target.value)}
                        placeholder="A detailed high-quality fashion photography of..."
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl text-sm focus:border-purple-500 focus:outline-none transition-colors resize-none font-mono"
                        rows={6}
                      />
                      <p className="text-xs text-cyan-200 mt-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        💡 このプロンプトが直接AI画像生成に使用されます。より詳細な指示を追加できます。
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setAppState('start')}
                    className="flex-1 px-8 py-4 glass-morphism-dark text-gray-300 rounded-xl font-semibold text-lg neon-border hover:neon-border-cyan hover:text-cyan-300 transition-all duration-300"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    ← 戻る
                  </button>
                  <button
                    onClick={createSession}
                    disabled={isLoading || !nickname.trim() || !clothingPrompt.trim()}
                    className="flex-1 px-8 py-4 cyber-gradient-green text-black rounded-xl font-semibold text-lg neon-border-green hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {isLoading ? '起動中...' : '⚡ システム起動'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* カメラ画面 */}
          {appState === 'camera' && currentSession && (
            <div>
              {/* セッション情報表示 */}
              <div className="mb-6 p-6 glass-morphism-dark rounded-2xl neon-border-cyan relative overflow-hidden">
                <div className="scanline"></div>
                <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
                  <div>
                    <p className="text-sm text-cyan-400 mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>NICKNAME</p>
                    <p className="text-2xl font-bold neon-text-cyan" style={{ fontFamily: 'Orbitron, sans-serif' }}>👤 {currentSession.nickname}</p>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm text-cyan-400 mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>FASHION PROMPT</p>
                    <p className="text-lg font-semibold text-cyan-100" style={{ fontFamily: 'Rajdhani, sans-serif' }}>👔 {currentSession.clothing_prompt}</p>
                  </div>
                </div>
              </div>

              {/* AI画像生成状態表示 */}
              {isGenerating && (
                <div className="mb-6 p-6 glass-morphism-dark rounded-2xl neon-border text-center relative overflow-hidden">
                  <div className="scanline"></div>
                  <div className="inline-block animate-spin text-6xl mb-4">🔄</div>
                  <p className="text-lg font-semibold text-purple-400">
                    服装画像を生成中...
                  </p>
                  <p className="text-sm text-cyan-200 mt-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    10〜30秒ほどお待ちください
                  </p>
                </div>
              )}

              {/* カメラビュー */}
              <div className="relative w-full max-w-6xl mx-auto mb-5 rounded-2xl overflow-hidden shadow-xl bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto block"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* 撮影ボタン */}
              <div className="flex gap-4 justify-center flex-wrap mb-5">
                <button
                  onClick={capturePhoto}
                  disabled={!stream || isLoading || !generatedImageUrl || isTryingOn}
                  className="px-12 py-6 cyber-gradient-green text-black rounded-xl font-bold text-xl neon-border-green hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  <span className="relative z-10">
                    {isTryingOn ? '🔄 処理中...' : isLoading ? '📸 撮影中...' : !generatedImageUrl ? '⏳ 準備中...' : '📸 撮影'}
                  </span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </button>
                <button
                  onClick={startNewSession}
                  className="px-8 py-4 cyber-gradient-cyan text-white rounded-xl font-bold text-lg neon-border-cyan hover:scale-105 transition-all duration-300"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  <span>🔄 新規セッション</span>
                </button>
              </div>

              {/* 処理中メッセージ */}
              {isTryingOn && (
                <div className="mt-8 p-6 glass-morphism-dark rounded-2xl neon-border-pink text-center relative overflow-hidden">
                  <div className="scanline"></div>
                  <div className="inline-block animate-spin text-6xl mb-4">👔</div>
                  <p className="text-lg font-semibold text-pink-400">
                    AIによる着せ替え処理中...
                  </p>
                  <p className="text-sm text-cyan-200 mt-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    30〜60秒ほどお待ちください
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 結果表示画面 */}
          {appState === 'result' && currentSession && (
            <div>
              {/* ヘッダー */}
              <div className="mb-6 p-6 glass-morphism-dark rounded-2xl neon-border-pink relative overflow-hidden">
                <div className="scanline"></div>
                <h2 className="text-3xl font-bold neon-text-pink text-center mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  👔 VIRTUAL TRY-ON RESULT
                </h2>
                <div className="flex items-center justify-center gap-4 text-cyan-200" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <span>👤 {currentSession.nickname}</span>
                  <span>|</span>
                  <span>👔 {currentSession.clothing_prompt}</span>
                </div>
              </div>

              {/* VTON結果画像 */}
              {tryonResult ? (
                <div className="mb-8">
                  <div className="w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl neon-border-pink bg-black">
                    <img
                      src={tryonResult}
                      alt="着せ替え結果"
                      className="w-full h-auto block"
                      style={{ objectFit: 'contain', maxHeight: 'none' }}
                    />
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-lg text-green-400 font-semibold mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      ✅ 着せ替え完了！
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-8 glass-morphism-dark rounded-2xl neon-border text-center">
                  <div className="inline-block animate-spin text-6xl mb-4">👔</div>
                  <p className="text-lg font-semibold text-pink-400">
                    AIによる着せ替え処理中...
                  </p>
                  <p className="text-sm text-cyan-200 mt-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    30〜60秒ほどお待ちください
                  </p>
                </div>
              )}

              {/* 操作ボタン */}
              <div className="flex gap-4 justify-center flex-wrap mb-8">
                <button
                  onClick={() => {
                    setCapturedImage(null)
                    setTryonResult(null)
                    setAppState('camera')
                    startCamera()
                  }}
                  className="px-8 py-4 cyber-gradient-green text-black rounded-xl font-bold text-lg neon-border-green hover:scale-105 transition-all duration-300"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  <span>📸 もう一度撮影</span>
                </button>
                <button
                  onClick={startNewSession}
                  className="px-8 py-4 cyber-gradient-cyan text-white rounded-xl font-bold text-lg neon-border-cyan hover:scale-105 transition-all duration-300"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  <span>🔄 新規セッション</span>
                </button>
              </div>

              {/* ギャラリーセクション */}
              <div className="mt-12 p-6 glass-morphism-dark rounded-2xl neon-border relative overflow-hidden">
                <div className="scanline"></div>
                <h3 className="text-2xl font-bold neon-text mb-6 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  🖼️ GALLERY
                </h3>
                
                <div className="flex justify-center mb-6">
                  <button
                    onClick={loadPhotos}
                    className="px-6 py-3 cyber-gradient text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    <span className="text-lg mr-2">🔄</span> 更新
                  </button>
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {photos.map((photo) => {
                      const photoSession = sessions.find(s => s.id === photo.session_id)
                      return (
                        <div 
                          key={photo.id} 
                          className="glass-morphism rounded-xl overflow-hidden neon-border hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => {
                            setSelectedPhoto(photo)
                            setSelectedSession(photoSession || null)
                          }}
                        >
                          <div className="aspect-video bg-black relative overflow-hidden">
                            {photo.vton_result_url ? (
                              <img 
                                src={photo.vton_result_url} 
                                alt="VTON結果"
                                className="w-full h-full object-contain"
                              />
                            ) : photo.storage_url ? (
                              <img 
                                src={photo.storage_url} 
                                alt="撮影画像"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                画像なし
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <p className="text-xs text-cyan-300 mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {new Date(photo.timestamp).toLocaleString('ja-JP')}
                            </p>
                            {photo.vton_result_url && (
                              <span className="inline-block px-2 py-1 bg-pink-500 text-white text-xs rounded-full">
                                👔 着せ替え済み
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-xl text-gray-400 mb-4">まだ写真がありません</p>
                    <p className="text-sm text-gray-500">カメラで撮影を開始しましょう！</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ギャラリー画面 */}
          {appState === 'gallery' && (
            <div>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-bold neon-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>🖼️ GALLERY</h2>
                <div className="flex gap-3">
                  <button
                    onClick={loadPhotos}
                    className="px-6 py-3 cyber-gradient text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    <span className="text-lg mr-2">🔄</span> 更新
                  </button>
                  <button
                    onClick={() => setAppState('start')}
                    className="px-6 py-3 cyber-gradient-cyan text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    <span className="text-lg mr-2">🏠</span> ホーム
                  </button>
                </div>
              </div>

              {photos.length === 0 ? (
                <p className="text-center text-cyan-200 py-20 text-lg italic" style={{ fontFamily: 'Rajdhani, sans-serif' }}>まだ写真が保存されていません。</p>
              ) : (
                <div className="space-y-8">
                  {/* セッション別にグループ化 */}
                  {sessions.map((session) => {
                    const sessionPhotos = photos.filter((p: any) => p.session_id === session.id)
                    if (sessionPhotos.length === 0) return null

                    return (
                      <div key={session.id} className="neon-border glass-morphism-dark rounded-2xl p-6 relative overflow-hidden">
                        <div className="scanline"></div>
                        <div className="mb-4 relative z-10">
                          <h3 className="text-xl font-bold neon-text-cyan mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            👤 {session.nickname}
                          </h3>
                          <p className="text-cyan-200" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            👔 {session.clothing_prompt}
                          </p>
                          <p className="text-sm text-cyan-400 mt-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            📅 {new Date(session.created_at).toLocaleString('ja-JP')}
                          </p>
                          {session.generated_image_url && (
                            <div className="mt-4 p-3 glass-morphism rounded-xl inline-block">
                              <p className="text-xs text-cyan-400 mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                🎨 AI生成画像:
                              </p>
                              <img
                                src={session.generated_image_url}
                                alt="AI生成服装"
                                className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => window.open(session.generated_image_url!, '_blank')}
                              />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
                          {sessionPhotos.map((photo: any) => (
                            <div
                              key={photo.id}
                              className="rounded-xl overflow-hidden neon-border-cyan transition-transform hover:scale-105 bg-black cursor-pointer"
                              onClick={() => {
                                setSelectedPhoto(photo)
                                setSelectedSession(session)
                              }}
                            >
                              {/* VTON結果があればそれを表示、なければ撮影画像 */}
                              <div className="w-full h-48">
                                <img
                                  src={photo.vton_result_url || photo.storage_url || photo.filepath}
                                  alt={photo.filename}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="p-3 glass-morphism-dark">
                                <p className="text-xs text-cyan-300 mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                  {new Date(photo.timestamp).toLocaleString('ja-JP')}
                                </p>
                                {photo.vton_result_url ? (
                                  <span className="inline-block px-2 py-1 bg-pink-500 text-white text-xs rounded-full">
                                    👔 着せ替え済み
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-1 bg-cyan-500 text-white text-xs rounded-full">
                                    📸 撮影画像
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* モーダル: 写真詳細 */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => {
            setSelectedPhoto(null)
            setSelectedSession(null)
          }}
        >
          <div 
            className="glass-morphism-dark rounded-2xl neon-border p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="scanline"></div>
            
            {/* 閉じるボタン */}
            <button
              onClick={() => {
                setSelectedPhoto(null)
                setSelectedSession(null)
              }}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white text-2xl font-bold shadow-lg transition-all"
            >
              ×
            </button>

            {/* セッション情報 */}
            {selectedSession && (
              <div className="mb-6 relative z-10">
                <h3 className="text-2xl font-bold neon-text-cyan mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  👤 {selectedSession.nickname}
                </h3>
                <p className="text-cyan-200 text-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  👔 {selectedSession.clothing_prompt}
                </p>
                <p className="text-sm text-cyan-400 mt-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  📅 {new Date(selectedPhoto.timestamp).toLocaleString('ja-JP')}
                </p>
              </div>
            )}

            {/* 画像グリッド */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {/* AI生成画像 */}
              {selectedSession?.generated_image_url && (
                <div className="glass-morphism rounded-xl overflow-hidden neon-border-cyan">
                  <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
                    <h4 className="text-lg font-bold neon-text text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      🎨 AI生成服装
                    </h4>
                  </div>
                  <div className="p-4 bg-black">
                    <img
                      src={selectedSession.generated_image_url}
                      alt="AI生成服装"
                      className="w-full h-auto object-contain rounded-lg cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(selectedSession.generated_image_url!, '_blank')}
                    />
                  </div>
                </div>
              )}

              {/* 撮影画像 */}
              {selectedPhoto.storage_url && (
                <div className="glass-morphism rounded-xl overflow-hidden neon-border-cyan">
                  <div className="p-4 bg-gradient-to-r from-cyan-900/50 to-blue-900/50">
                    <h4 className="text-lg font-bold neon-text-cyan text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      📸 撮影画像
                    </h4>
                  </div>
                  <div className="p-4 bg-black">
                    <img
                      src={selectedPhoto.storage_url}
                      alt="撮影画像"
                      className="w-full h-auto object-contain rounded-lg cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(selectedPhoto.storage_url!, '_blank')}
                    />
                  </div>
                </div>
              )}

              {/* VTON結果 */}
              {selectedPhoto.vton_result_url && (
                <div className="glass-morphism rounded-xl overflow-hidden neon-border-cyan">
                  <div className="p-4 bg-gradient-to-r from-pink-900/50 to-purple-900/50">
                    <h4 className="text-lg font-bold neon-text text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      👔 着せ替え結果
                    </h4>
                  </div>
                  <div className="p-4 bg-black">
                    <img
                      src={selectedPhoto.vton_result_url}
                      alt="着せ替え結果"
                      className="w-full h-auto object-contain rounded-lg cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(selectedPhoto.vton_result_url!, '_blank')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 画像がない場合の説明 */}
            {!selectedSession?.generated_image_url && !selectedPhoto.storage_url && !selectedPhoto.vton_result_url && (
              <div className="text-center py-12 relative z-10">
                <p className="text-xl text-gray-400">画像がありません</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
