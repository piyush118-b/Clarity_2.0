"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { GoogleGenerativeAI } from "@google/generative-ai"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  File, 
  ImageIcon, 
  FileSpreadsheet, 
  FileType, 
  Cloud,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface UploadedFile {
  id: string
  file: File
  progress: number
  status: "uploading" | "completed" | "error"
  category?: string
  assignedTo?: string
  description?: string
  url?: string
}

interface EnhancedUploadServiceProps {
  onUploadComplete?: (files: UploadedFile[]) => void
  bucket?: string
  allowedTypes?: string[]
  maxFileSize?: number // in MB
  category?: string
  showCategorySelect?: boolean
  showAssignmentSelect?: boolean
  showDescription?: boolean
}

export function EnhancedUploadService({ 
  onUploadComplete,
  bucket = "documents",
  allowedTypes = ["image/*", "application/pdf", ".doc", ".docx", ".txt"],
  maxFileSize = 10,
  category,
  showCategorySelect = true,
  showAssignmentSelect = false,
  showDescription = true
}: EnhancedUploadServiceProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "")
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

  const categories = [
    { value: "lease", label: "Lease Agreement" },
    { value: "maintenance", label: "Maintenance Request" },
    { value: "payment", label: "Payment Receipt" },
    { value: "identification", label: "Identification" },
    { value: "other", label: "Other" },
  ]

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return ImageIcon
    if (fileType.includes("pdf")) return FileType
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return FileSpreadsheet
    return File
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`
    }

    // Check file type
    const isValidType = allowedTypes.some(type => {
      if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      if (type.includes("*")) {
        const baseType = type.split("/")[0]
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })

    if (!isValidType) {
      return `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`
    }

    return null
  }

  const processDocumentWithGemini = async (file: File): Promise<string> => {
    try {
      // Convert file to base64
      const fileBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(fileBuffer)
      const base64String = btoa(String.fromCharCode(...uint8Array))
      
      const result = await model.generateContent([
        {
          text: "Please extract all text content from this document word for word. Provide only the extracted text without any additional commentary or formatting."
        },
        {
          inlineData: {
            mimeType: file.type,
            data: base64String
          }
        }
      ])
      
      const response = await result.response
      return response.text() || ""
    } catch (error) {
      console.error('Error processing document with Gemini:', error)
      return ""
    }
  }

  const uploadFile = async (file: File, fileId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      // Process document with Gemini for OCR
      let documentOcr = ""
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        documentOcr = await processDocumentWithGemini(file)
      }

      // Update file status
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: "completed" as const, progress: 100, url: publicUrl }
          : f
      ))

      // Save to database with OCR text
      await supabase.from('documents').insert({
        user_id: user.id,
        file_path: data.path,
        status: 'uploaded',
        uploaded_at: new Date().toISOString(),
        document_ocr: documentOcr
      })

      toast.success(`${file.name} uploaded successfully`)

    } catch (error) {
      console.error('Upload error:', error)
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: "error" as const }
          : f
      ))
      toast.error(`Failed to upload ${file.name}`)
    }
  }

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = []
    
    Array.from(selectedFiles).forEach(file => {
      const validationError = validateFile(file)
      if (validationError) {
        toast.error(validationError)
        return
      }

      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      newFiles.push({
        id: fileId,
        file,
        progress: 0,
        status: "uploading",
        category: category || "other",
      })
    })

    setFiles(prev => [...prev, ...newFiles])

    // Start uploads
    newFiles.forEach(fileData => {
      uploadFile(fileData.file, fileData.id)
    })
  }, [category])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const updateFileMetadata = (fileId: string, field: keyof UploadedFile, value: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, [field]: value } : f
    ))
  }

  const handleUploadAll = async () => {
    if (onUploadComplete) {
      onUploadComplete(files.filter(f => f.status === "completed"))
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Cloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Documents
            </h3>
            <p className="text-gray-500 mb-4">
              Drag and drop files here, or click to select files
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Files
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Max file size: {maxFileSize}MB. Allowed types: {allowedTypes.join(", ")}
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(",")}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Uploaded Files</h3>
            <div className="space-y-4">
              {files.map((fileData) => {
                const FileIcon = getFileIcon(fileData.file.type)
                
                return (
                  <div key={fileData.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <FileIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {fileData.file.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            {fileData.status === "completed" && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {fileData.status === "error" && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            {fileData.status === "uploading" && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(fileData.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-2">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>

                        {fileData.status === "uploading" && (
                          <Progress value={fileData.progress} className="mb-3" />
                        )}

                        {/* Metadata Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {showCategorySelect && (
                            <div>
                              <Label htmlFor={`category-${fileData.id}`} className="text-xs">
                                Category
                              </Label>
                              <Select
                                value={fileData.category}
                                onValueChange={(value) => updateFileMetadata(fileData.id, 'category', value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {showDescription && (
                            <div className="md:col-span-2">
                              <Label htmlFor={`description-${fileData.id}`} className="text-xs">
                                Description
                              </Label>
                              <Textarea
                                id={`description-${fileData.id}`}
                                value={fileData.description || ""}
                                onChange={(e) => updateFileMetadata(fileData.id, 'description', e.target.value)}
                                placeholder="Add a description..."
                                className="h-16 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {files.some(f => f.status === "completed") && (
              <div className="mt-4 pt-4 border-t">
                <Button onClick={handleUploadAll} className="w-full">
                  Complete Upload ({files.filter(f => f.status === "completed").length} files)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
