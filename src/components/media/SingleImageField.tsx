import React, { useRef, useState } from 'react';
import { ImageOff, Trash2, Upload } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errors';
import { Media } from '../../types/media';

interface SingleImageFieldProps {
  label: string;
  image: Media | null | undefined;
  onUpload: (file: File) => Promise<Media>;
  onDelete: () => Promise<void>;
  onChange: (image: Media | null) => void;
  /** 'circle' for avatars, 'square' for a product/catalog photo. */
  shape?: 'square' | 'circle';
}

/**
 * Shared by Item's single IMAGE, and every AVATAR (a user's own profile, or
 * an admin managing another user's) — all three are "at most one photo,
 * uploading again replaces it" (see MediaCollection::isSingleton() on the
 * backend), unlike Venue/Field's multi-image gallery (see
 * ImageGalleryModal instead).
 */
const SingleImageField: React.FC<SingleImageFieldProps> = ({
  label,
  image,
  onUpload,
  onDelete,
  onChange,
  shape = 'square',
}) => {
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      const media = await onUpload(file);
      onChange(media);
      showToast('Şəkil yükləndi', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Şəkil yüklənə bilmədi'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      onChange(null);
      showToast('Şəkil silindi', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Şəkil silinə bilmədi'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="single-image-field">
        <div className={`single-image-preview${shape === 'circle' ? ' is-circle' : ''}`}>
          {image ? <img src={image.url} alt={label} /> : <ImageOff size={20} />}
        </div>
        <div className="single-image-controls">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="visually-hidden"
            onChange={handleFileSelected}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? <span className="spinner spinner-sm" /> : <Upload size={14} />}
            <span>{image ? 'Dəyiş' : 'Yüklə'}</span>
          </button>
          {image && (
            <button type="button" className="btn btn-danger btn-sm" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? <span className="spinner spinner-sm" /> : <Trash2 size={14} />}
              <span>Sil</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleImageField;
