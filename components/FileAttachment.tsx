"use client"

import { File, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileAttachmentProps {
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: string
  className?: string
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (fileType: string) => {
  if (fileType === 'application/pdf') {
    return <File className="h-4 w-4 text-red-600" />
  }
  return <File className="h-4 w-4 text-gray-600" />
}

export default function FileAttachment({ 
  fileName, 
  fileSize, 
  fileType, 
  uploadedAt, 
  className 
}: FileAttachmentProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-w-sm",
      className
    )}>
      <div className="flex-shrink-0">
        {getFileIcon(fileType)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {fileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(fileSize)} 
        </p>
      </div>
    </div>
  )
}