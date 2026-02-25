import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Image, X, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl: string | null;
  onClear: () => void;
}

export const ChatImageUpload: React.FC<ChatImageUploadProps> = ({
  onImageUploaded,
  currentImageUrl,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG, WebP ou GIF.");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 10MB)");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `chat-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("observations")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: signedData, error: signError } = await supabase.storage
        .from("observations")
        .createSignedUrl(fileName, 3600);

      if (signError || !signedData?.signedUrl) throw signError || new Error('Failed to create signed URL');
      onImageUploaded(signedData.signedUrl);
      toast.success("Image prête à être analysée");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (currentImageUrl) {
    return (
      <div className="relative inline-block">
        <img
          src={currentImageUrl}
          alt="À analyser"
          className="h-12 w-12 object-cover rounded-lg border border-primary/30"
        />
        <button
          onClick={onClear}
          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="text-cream/60 hover:text-cream hover:bg-primary/10"
        title="Ajouter une image à analyser"
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Image className="h-5 w-5" />
        )}
      </Button>
    </>
  );
};
