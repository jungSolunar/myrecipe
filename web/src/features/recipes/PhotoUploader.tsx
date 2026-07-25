import { useRef, useState } from 'react';
import { uploadsApi } from '../../api';
import { Button, Icon } from '../../components';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB (G2 확정)
const ACCEPT = ['image/png', 'image/jpeg'];

export interface PhotoUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

/** US-004 대표 사진(선택). /uploads/images 로 업로드 후 photo_url 보관. 없어도 저장 가능. */
export function PhotoUploader({ value, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File) {
    setError(null);
    if (!ACCEPT.includes(file.type)) {
      setError('JPG 또는 PNG 파일만 올릴 수 있어요.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('파일 용량은 최대 5MB까지예요.');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadsApi.uploadImage(file);
      onChange(res.url);
    } catch {
      setError('사진 업로드에 실패했어요. 없이도 저장할 수 있어요.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="uploader">
      {value ? (
        <div>
          <img className="uploader__preview" src={value} alt="업로드한 대표 사진 미리보기" />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            사진 제거
          </Button>
        </div>
      ) : (
        <>
          <p>이미지를 선택해 대표 사진을 추가하세요.</p>
          <p style={{ marginTop: 'var(--s-2)' }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              파일 선택
            </Button>
          </p>
          <p className="field__hint" style={{ marginTop: 'var(--s-2)' }}>
            JPG/PNG, 최대 5MB · 없어도 저장됩니다
          </p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        aria-label="대표 사진 파일 선택"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = '';
        }}
      />
      {error && (
        <p className="field__error" role="alert" style={{ justifyContent: 'center' }}>
          <Icon name="warning" size={14} /> {error}
        </p>
      )}
    </div>
  );
}
