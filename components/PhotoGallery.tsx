"use client";

import { useState, useEffect } from "react";
import {
  Camera,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { useLocale } from "@/lib/LocaleContext";

type Photo = {
  id: string;
  filename: string;
  url: string;
  thumbnail: string | null;
  caption: string | null;
  uploadedBy: string | null;
  createdAt: string;
};
type StorageConfig = { id: string; type: string; config: string } | null;
type Member = { id: string; name: string; isAdmin: boolean } | null;

interface PhotoGalleryProps {
  tripId: string;
  photos: Photo[];
  storageConfig: StorageConfig;
  currentMember: Member;
}

interface ExternalLinks {
  googlePhotosLink: string;
  synologyShareLink: string;
  synologyRequestLink: string;
}

export function PhotoGallery({
  tripId,
  photos: initialPhotos,
  storageConfig,
  currentMember,
}: PhotoGalleryProps) {
  const { t } = useLocale();
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [links, setLinks] = useState<ExternalLinks | null>(null);

  useEffect(() => {
    if (!storageConfig) return;

    fetch(`/api/trips/${tripId}/storage`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.configured || !data.credentials) return;
        setLinks({
          googlePhotosLink: data.credentials.googlePhotosLink || "",
          synologyShareLink: data.credentials.synologyShareLink || "",
          synologyRequestLink: data.credentials.synologyRequestLink || "",
        });
      })
      .catch(() => {});
  }, [tripId, storageConfig]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++)
        formData.append("photos", files[i]);
      formData.append("uploadedBy", currentMember?.name || "Unknown");
      const response = await fetch(`/api/trips/${tripId}/photos`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const newPhotos = await response.json();
        setPhotos([...newPhotos, ...photos]);
      } else {
        const data = await response.json();
        alert(data.error || t.common.error);
      }
    } catch (error) {
      alert(t.common.error);
    } finally {
      setUploading(false);
    }
  };

  const hasLinks =
    links &&
    (links.googlePhotosLink ||
      links.synologyShareLink ||
      links.synologyRequestLink);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Camera className="w-6 h-6 text-orange-500" />
          {t.photos.title}
        </h2>
        {!hasLinks ? (
          <label className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.photos.uploading}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {t.photos.upload}
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        ) : (
          ""
        )}
      </div>

      {hasLinks ? (
        <div className="flex flex-wrap gap-3">
          {links.synologyRequestLink && (
            <a
              href={links.synologyRequestLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition"
            >
              <Upload className="w-4 h-4" />
              {t.photos.uploadToSynology}
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}
          {links.synologyShareLink && (
            <a
              href={links.synologyShareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-600 text-sm font-medium transition"
            >
              {t.photos.viewOnSynology}
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}
          {links.googlePhotosLink && (
            <a
              href={links.googlePhotosLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-600 text-sm font-medium transition"
            >
              {t.photos.viewOnGoogle}
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}
        </div>
      ) : (
        <div>
          {selectedPhoto && (
            <div
              className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 text-white hover:text-stone-300"
              >
                <X className="w-8 h-8" />
              </button>
              <div
                className="max-w-5xl max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || selectedPhoto.filename}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
                {selectedPhoto.caption && (
                  <p className="text-white text-center mt-3">
                    {selectedPhoto.caption}
                  </p>
                )}
                {selectedPhoto.uploadedBy && (
                  <p className="text-stone-400 text-center text-sm mt-1">
                    {t.photos.uploadedBy} {selectedPhoto.uploadedBy}
                  </p>
                )}
              </div>
            </div>
          )}
          {photos.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-xl p-12 shadow-sm border border-stone-200 dark:border-stone-800 text-center">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-stone-300 dark:text-stone-600" />
              <h3 className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-2">
                {t.photos.noPhotos}
              </h3>
              <p className="text-stone-500 dark:text-stone-400 mb-4">
                {t.photos.noPhotosDesc}
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium cursor-pointer">
                <Upload className="w-4 h-4" />
                {t.photos.uploadFirst}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 hover:opacity-90 transition group"
                >
                  <img
                    src={photo.thumbnail || photo.url}
                    alt={photo.caption || photo.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
                  {photo.uploadedBy && (
                    <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                      {photo.uploadedBy}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
