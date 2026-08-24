"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  value: string;
  onChange: (base64: string) => void;
  nameFallback?: string;
  size?: "sm" | "md" | "lg";
}

export function AvatarUpload({ value, onChange, nameFallback = "U", size = "md" }: AvatarUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("") || "U";
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const base64 = await resizeAndConvertImage(file, 400);
      onChange(base64);
    } catch (error) {
      console.error("Erro ao processar imagem", error);
      alert("Não foi possível carregar esta imagem. Tente outra.");
    } finally {
      setIsProcessing(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const resizeAndConvertImage = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Manter a proporção
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas not supported");

          // Preencher fundo com branco caso a imagem tenha transparência (opcional, mas bom p/ JPEG)
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Exportar como webp ou jpeg com 80% de qualidade para reduzir bastante o tamanho
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-32 h-32 text-4xl"
  };

  return (
    <div className="relative group inline-block">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div 
        onClick={handleClick}
        className={`rounded-full overflow-hidden bg-brand-main/20 flex items-center justify-center border-2 border-brand-main/50 relative cursor-pointer ${sizeClasses[size]}`}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-brand-main animate-spin" />
        ) : value ? (
          <Image 
            src={value} 
            alt={nameFallback} 
            fill 
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className={`text-brand-main font-bold ${size === "lg" ? "text-4xl" : "text-3xl"}`}>
            {getInitials(nameFallback)}
          </span>
        )}
        
        {!isProcessing && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
