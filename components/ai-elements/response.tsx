'use client';

import { cn } from '@/lib/utils';
import React, { memo, useState } from 'react';
import MarkdownContent from '@/components/MarkdownContent';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import FileAttachment from '@/components/FileAttachment';

type ResponseProps = {
  children: string;
  className?: string;
  showActions?: boolean;
  role?: 'user' | 'assistant' | 'system';
};

// Function to detect and render file attachments and image URLs
const processContent = (text: string, onImageClick: (url: string) => void) => {
  // First, extract and process file attachments
  const fileAttachmentRegex = /\[FILE_ATTACHMENT:(\{[^}]+\})\]/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = fileAttachmentRegex.exec(text)) !== null) {
    // Add text before the file attachment
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      if (beforeText.trim()) {
        parts.push(beforeText);
      }
    }

    // Parse and add file attachment
    try {
      const fileMetadata = JSON.parse(match[1]);
      parts.push(
        <div key={`file-${match.index}`} className="my-3">
          <FileAttachment
            fileName={fileMetadata.fileName}
            fileSize={fileMetadata.fileSize}
            fileType={fileMetadata.fileType}
            uploadedAt={fileMetadata.uploadedAt}
          />
        </div>
      );
    } catch (error) {
      console.error('Failed to parse file metadata:', error);
      parts.push(match[0]); // Fallback to original text
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push(remainingText);
    }
  }

  // If no file attachments found, process as images only
  if (parts.length === 0) {
    return processImageUrls(text, onImageClick);
  }

  // Process each text part for images
  return parts.map((part, index) => {
    if (typeof part === 'string') {
      return processImageUrls(part, onImageClick).map((subPart, subIndex) => 
        React.cloneElement(subPart as React.ReactElement, { key: `${index}-${subIndex}` })
      );
    }
    return part;
  }).flat();
};

// Function to detect and render image URLs (including those in markdown links)
const processImageUrls = (text: string, onImageClick: (url: string) => void) => {
  // First, extract image URLs from markdown links: [text](imageurl)
  const markdownImageRegex = /\[([^\]]*)\]\((https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s\)]*)?)\)/gi;

  // Replace markdown image links with just the image URL for processing
  const processedText = text.replace(markdownImageRegex, (_match, _altText, url) => {
    return url; // Replace the entire markdown link with just the URL
  });

  // Now split by image URLs (both plain and extracted from markdown)
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi;
  const parts = processedText.split(imageUrlRegex);

  return parts.map((part, index) => {
    // Create a new regex instance to avoid state issues
    const testRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/i;

    if (testRegex.test(part)) {
      return (
        <div key={index} className="my-4">
          <div className="relative inline-block cursor-pointer" onClick={() => onImageClick(part)}>
            <Image
              src={part}
              alt="Shared image"
              width={400}
              height={300}
              className="rounded-lg max-w-fit h-[15rem] shadow-sm hover:shadow-md transition-shadow"
              style={{ objectFit: 'contain' }}
              unoptimized // Since these are external URLs
              onError={(e) => {
                // If image fails to load, show the URL as text
                const target = e.target as HTMLImageElement;
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<p class="text-blue-600 underline break-all">${part}</p>`;
                }
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 break-all opacity-75">{part}</p>
        </div>
      );
    }

    // For non-image parts, render as markdown if they contain text
    if (part.trim()) {
      return (
        <MarkdownContent key={index} className="inline">
          {part}
        </MarkdownContent>
      );
    }

    return null;
  }).filter(Boolean);
};

export const Response = memo(
  ({ className, children, ...props }: ResponseProps) => {
    const [modalImage, setModalImage] = useState<string | null>(null);
    
    // Check if content contains file attachments, image URLs (plain or in markdown links)
    const fileAttachmentRegex = /\[FILE_ATTACHMENT:(\{[^}]+\})\]/g;
    const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi;
    const markdownImageRegex = /\[([^\]]*)\]\((https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s\)]*)?)\)/gi;
    const hasSpecialContent = fileAttachmentRegex.test(children) || imageUrlRegex.test(children) || markdownImageRegex.test(children);

    if (hasSpecialContent) {
      const processedContent = processContent(children, setModalImage);
      return (
        <>
          <div
            className={cn(
              'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
              className
            )}
            {...props}
          >
            {processedContent}
          </div>
          
          <Dialog open={!!modalImage} onOpenChange={() => setModalImage(null)}>
            <DialogContent className="max-w-[90vw] max-h-[90vh]  w-full p-0">
              <DialogTitle className="sr-only">Image preview</DialogTitle>
              {modalImage && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={modalImage}
                    alt="Enlarged image"
                    width={1200}
                    height={800}
                    className="max-w-full max-h-full object-contain w-full h-full"
                    unoptimized
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      );
    }

    return (
      <MarkdownContent
        className={cn(
          'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          className
        )}
        {...props}
      >
        {children}
      </MarkdownContent>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.showActions === nextProps.showActions &&
    prevProps.role === nextProps.role
);

Response.displayName = 'Response';
