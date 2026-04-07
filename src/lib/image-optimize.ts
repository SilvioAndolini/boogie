const MAX_WIDTH = 1920
const MAX_HEIGHT = 1440
const TARGET_SIZE_KB = 400
const MIN_QUALITY = 0.6
const MAX_QUALITY = 0.92

export async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width
        width = MAX_WIDTH
      }
      if (height > MAX_HEIGHT) {
        width = (width * MAX_HEIGHT) / height
        height = MAX_HEIGHT
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width)
      canvas.height = Math.round(height)

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'))
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      let quality = MAX_QUALITY
      let blob: Blob | null = null

      const tryCompress = (q: number): Promise<Blob | null> => {
        return new Promise((res) => {
          canvas.toBlob(
            (b) => res(b),
            'image/webp',
            q
          )
        })
      }

      const findQuality = async () => {
        blob = await tryCompress(quality)
        if (!blob) return null

        const sizeKB = blob.size / 1024
        if (sizeKB <= TARGET_SIZE_KB || quality <= MIN_QUALITY) {
          return blob
        }

        while (quality > MIN_QUALITY) {
          quality -= 0.05
          const newBlob = await tryCompress(quality)
          if (newBlob && newBlob.size / 1024 <= TARGET_SIZE_KB) {
            return newBlob
          }
        }

        return await tryCompress(MIN_QUALITY)
      }

      findQuality().then((finalBlob) => {
        if (!finalBlob) {
          reject(new Error('No se pudo comprimir la imagen'))
          return
        }

        const fileName = file.name.replace(/\.[^.]+$/, '.webp')
        const optimizedFile = new File([finalBlob], fileName, {
          type: 'image/webp',
          lastModified: Date.now(),
        })

        resolve(optimizedFile)
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo cargar la imagen'))
    }

    img.src = url
  })
}

export async function optimizeMultipleImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(optimizeImage))
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}