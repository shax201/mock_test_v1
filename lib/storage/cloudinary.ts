import { v2 as cloudinary } from 'cloudinary'

// Helper function to convert File to Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  public_id: string
  secure_url: string
  format: string
  bytes: number
}

export async function uploadAudio(file: File | Buffer, filename?: string): Promise<UploadResult> {
  try {
    let fileData: string;
    
    if (file instanceof File) {
      const buffer = await fileToBuffer(file);
      fileData = `data:${file.type};base64,${buffer.toString('base64')}`;
    } else {
      fileData = `data:audio/mp3;base64,${file.toString('base64')}`;
    }
    
    // Set a longer timeout for large audio files (5 minutes)
    const uploadOptions = {
      resource_type: 'video' as const, // Audio files are treated as video in Cloudinary
      folder: 'ielts-mock/audio',
      public_id: filename ? `audio_${filename}` : undefined,
      format: 'mp3',
      quality: 'auto',
      fetch_format: 'auto',
      timeout: 300000, // 5 minutes timeout
      chunk_size: 6000000, // 6MB chunks for large files
      eager: [], // Don't generate transformations immediately
      eager_async: true, // Process transformations asynchronously
      use_filename: false, // Don't use original filename
      unique_filename: true, // Generate unique filename
      overwrite: false, // Don't overwrite existing files
      invalidate: true, // Invalidate CDN cache
      tags: ['ielts', 'audio', 'mock-test'] // Add tags for organization
    };
    
    console.log(`Starting upload for file: ${filename || 'unnamed'}, size: ${file instanceof File ? file.size : file.length} bytes`);
    
    const result = await cloudinary.uploader.upload(
      fileData,
      uploadOptions
    );

    console.log(`Upload completed successfully: ${result.public_id}`);
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes
    }
  } catch (error: any) {
    console.error('Error uploading audio to Cloudinary:', error);
    
    // Provide more specific error messages
    if (error.http_code === 499 || error.name === 'TimeoutError') {
      throw new Error('Upload timeout - file may be too large. Please try a smaller file or check your internet connection.');
    } else if (error.http_code === 400) {
      throw new Error('Invalid file format. Please ensure the file is a valid audio format.');
    } else if (error.http_code === 413) {
      throw new Error('File too large. Please compress the audio file or use a smaller file.');
    } else if (error.http_code === 401) {
      throw new Error('Authentication failed. Please check Cloudinary configuration.');
    } else {
      throw new Error(`Upload failed: ${error.message || 'Unknown error occurred'}`);
    }
  }
}

export async function uploadImage(file: File | Buffer, filename?: string): Promise<UploadResult> {
  try {
    let fileData: string;
    
    if (file instanceof File) {
      const buffer = await fileToBuffer(file);
      fileData = `data:${file.type};base64,${buffer.toString('base64')}`;
    } else {
      fileData = `data:image/png;base64,${file.toString('base64')}`;
    }
    
    const uploadOptions = {
      resource_type: 'image' as const,
      folder: 'ielts-mock/images',
      public_id: filename ? `image_${filename}` : undefined,
      quality: 'auto',
      fetch_format: 'auto',
      use_filename: false,
      unique_filename: true,
      overwrite: false,
      invalidate: true,
      tags: ['ielts', 'image', 'flow-chart', 'mock-test']
    };
    
    console.log(`Starting image upload: ${filename || 'unnamed'}, size: ${file instanceof File ? file.size : file.length} bytes`);
    
    const result = await cloudinary.uploader.upload(
      fileData,
      uploadOptions
    );

    console.log(`Image upload completed successfully: ${result.public_id}`);
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes
    }
  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error);
    
    // Provide more specific error messages
    if (error.http_code === 400) {
      throw new Error('Invalid image format. Please ensure the file is a valid image format.');
    } else if (error.http_code === 413) {
      throw new Error('Image too large. Please compress the image or use a smaller file.');
    } else if (error.http_code === 401) {
      throw new Error('Authentication failed. Please check Cloudinary configuration.');
    } else {
      throw new Error(`Upload failed: ${error.message || 'Unknown error occurred'}`);
    }
  }
}

export async function uploadPDF(file: Buffer, filename: string): Promise<UploadResult> {
  try {
    const result = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${file.toString('base64')}`,
      {
        resource_type: 'raw',
        folder: 'ielts-mock/reports',
        public_id: filename.replace('.pdf', ''),
        format: 'pdf'
      }
    )

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes
    }
  } catch (error) {
    console.error('Error uploading PDF to Cloudinary:', error)
    throw new Error('Failed to upload PDF file')
  }
}

export async function deleteFile(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error)
    return false
  }
}

export async function getFileUrl(publicId: string): Promise<string> {
  try {
    return cloudinary.url(publicId, {
      secure: true,
      resource_type: 'auto'
    })
  } catch (error) {
    console.error('Error generating file URL:', error)
    throw new Error('Failed to generate file URL')
  }
}

export function generateAudioFilename(candidateNumber: string, testTitle: string): string {
  const sanitizedTitle = testTitle.replace(/[^a-zA-Z0-9]/g, '_')
  const timestamp = Date.now()
  return `audio_${candidateNumber}_${sanitizedTitle}_${timestamp}.mp3`
}

export function generatePDFFilename(candidateNumber: string, testTitle: string): string {
  const sanitizedTitle = testTitle.replace(/[^a-zA-Z0-9]/g, '_')
  const timestamp = Date.now()
  return `report_${candidateNumber}_${sanitizedTitle}_${timestamp}.pdf`
}
