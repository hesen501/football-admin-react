import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Star, Trash2, Upload } from 'lucide-react';
import Modal from '../common/Modal';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errors';
import { Media } from '../../types/media';

interface ImageGalleryModalProps {
  title: string;
  images: Media[];
  onClose: () => void;
  onChange: (images: Media[]) => void;
  onUpload: (file: File) => Promise<Media>;
  onDelete: (mediaId: number) => Promise<void>;
  onSetCover: (mediaId: number) => Promise<Media>;
  onReorder: (order: { id: number; sort_order: number }[]) => Promise<Media[]>;
}

/**
 * Shared by Venues and Fields — both are "any number of gallery images plus
 * at most one promoted to cover" (see VenueImageController/FieldImageController's
 * docblocks on the backend), so this is the one place that shape's upload/
 * delete/set-cover/reorder interactions are built, parameterized by the
 * caller's own venue- or field-scoped API calls.
 */
const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  title,
  images,
  onClose,
  onChange,
  onUpload,
  onDelete,
  onSetCover,
  onReorder,
}) => {
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  // media id currently being deleted/promoted/moved — scopes the disabled/
  // loading state to just that thumbnail's own controls.
  const [pendingId, setPendingId] = useState<number | null>(null);

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again later
    if (!file) return;

    setIsUploading(true);
    try {
      const media = await onUpload(file);
      onChange([...images, media]);
      showToast('Şəkil əlavə edildi', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Şəkil yüklənə bilmədi'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (mediaId: number) => {
    setPendingId(mediaId);
    try {
      await onDelete(mediaId);
      onChange(images.filter((m) => m.id !== mediaId));
      showToast('Şəkil silindi', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Şəkil silinə bilmədi'), 'error');
    } finally {
      setPendingId(null);
    }
  };

  const handleSetCover = async (mediaId: number) => {
    setPendingId(mediaId);
    try {
      const updated = await onSetCover(mediaId);
      // The endpoint only returns the newly-promoted row — the previous
      // cover (if any) demotes to gallery locally too, mirroring exactly
      // what MediaService::setCover() just did server-side.
      onChange(
        images.map((m) => {
          if (m.id === mediaId) return updated;
          if (m.collection === 'cover') return { ...m, collection: 'gallery' };
          return m;
        })
      );
      showToast('Əsas şəkil təyin edildi', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Əsas şəkil təyin edilə bilmədi'), 'error');
    } finally {
      setPendingId(null);
    }
  };

  const handleMove = async (mediaId: number, direction: -1 | 1) => {
    const index = sorted.findIndex((m) => m.id === mediaId);
    const swapIndex = index + direction;
    if (index === -1 || swapIndex < 0 || swapIndex >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const order = reordered.map((m, i) => ({ id: m.id, sort_order: i }));

    setPendingId(mediaId);
    try {
      const updated = await onReorder(order);
      onChange(updated);
    } catch (err) {
      showToast(getErrorMessage(err, 'Şəkillərin sırası dəyişdirilə bilmədi'), 'error');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      width="760px"
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Bağla
        </button>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="visually-hidden"
        onChange={handleFileSelected}
      />
      <button
        type="button"
        className="btn btn-primary btn-sm"
        style={{ marginBottom: 16 }}
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? <span className="spinner spinner-sm" /> : <Upload size={16} />}
        <span>Şəkil yüklə</span>
      </button>

      {sorted.length === 0 ? (
        <div className="image-gallery-empty">
          <ImageOff size={28} />
          <p className="cell-muted">Hələ heç bir şəkil əlavə edilməyib.</p>
        </div>
      ) : (
        <div className="image-gallery-grid">
          {sorted.map((media, index) => {
            const isPending = pendingId === media.id;
            const isCover = media.collection === 'cover';
            return (
              <div className={`image-gallery-item${isCover ? ' is-cover' : ''}`} key={media.id}>
                <img src={media.url} alt={`Şəkil ${index + 1}`} className="image-gallery-thumb" />
                {isCover && (
                  <span className="badge badge-success image-gallery-cover-badge">
                    <Star size={11} /> Əsas
                  </span>
                )}
                <div className="image-gallery-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    disabled={isPending || index === 0}
                    onClick={() => handleMove(media.id, -1)}
                    title="Sola daşı"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {!isCover && (
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={isPending}
                      onClick={() => handleSetCover(media.id)}
                      title="Əsas şəkil et"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn danger"
                    disabled={isPending}
                    onClick={() => handleDelete(media.id)}
                    title="Sil"
                  >
                    {isPending ? <span className="spinner spinner-sm" /> : <Trash2 size={14} />}
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    disabled={isPending || index === sorted.length - 1}
                    onClick={() => handleMove(media.id, 1)}
                    title="Sağa daşı"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default ImageGalleryModal;
