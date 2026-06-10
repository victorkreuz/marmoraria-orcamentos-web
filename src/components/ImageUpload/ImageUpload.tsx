import { useRef, useState } from 'react';
import { uploadMultiplasImagens } from '../../api/upload.service';
import type { OrcamentoImagem } from '../../types/api.types';
import styles from './ImageUpload.module.css';

interface Props {
  images: OrcamentoImagem[];
  onChange: (images: OrcamentoImagem[]) => void;
  disabled?: boolean;
}

const ACCEPTED = '.jpg,.jpeg,.png,.webp';

function getFileName(img: OrcamentoImagem): string {
  if (img.titulo) return img.titulo;
  try {
    const parts = img.url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  } catch {
    return img.url;
  }
}

export function ImageUpload({ images, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setUploadError('');
    setUploading(true);
    try {
      const urls = await uploadMultiplasImagens(arr);
      const newImages: OrcamentoImagem[] = urls.map((url, i) => ({
        url,
        titulo: arr[i]?.name ?? '',
      }));
      onChange([...images, ...newImages]);
    } catch {
      setUploadError('Falha ao enviar imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
    // reset input para permitir selecionar o mesmo arquivo novamente
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      {!disabled && (
        <>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : '+ Adicionar imagens'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className={styles.hiddenInput}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </>
      )}
      {uploadError && (
        <span className={styles.uploadError}>{uploadError}</span>
      )}
      {images.map((img, i) => (
        <span key={i} className={styles.chip}>
          <span className={styles.chipName} title={img.url}>
            {getFileName(img)}
          </span>
          {!disabled && (
            <button
              type="button"
              className={styles.chipRemove}
              onClick={() => remove(i)}
              aria-label="Remover imagem"
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
