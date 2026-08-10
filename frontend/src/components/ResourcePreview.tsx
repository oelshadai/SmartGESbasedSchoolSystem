import { Button } from '@/components/ui/button';
import { Download, ExternalLink, X } from 'lucide-react';

interface Resource {
  id: number;
  title: string;
  description: string;
  url: string;
  original_filename: string;
  content_type: string;
  resource_type: string;
}

interface Props {
  resource: Resource;
  onClose: () => void;
  onDownload?: (id: number, filename: string) => void;
}

function getPreviewMode(resource: Resource): 'video' | 'audio' | 'image' | 'pdf' | 'office' | 'none' {
  const ext = resource.original_filename.split('.').pop()?.toLowerCase() ?? '';
  const ct = (resource.content_type || '').toLowerCase();

  if (resource.resource_type === 'video' || ct.startsWith('video/')) return 'video';
  if (resource.resource_type === 'audio' || ct.startsWith('audio/')) return 'audio';
  if (resource.resource_type === 'image' || ct.startsWith('image/')) return 'image';
  if (ext === 'pdf' || ct === 'application/pdf') return 'pdf';
  if (['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) return 'office';
  return 'none';
}

const ResourcePreview = ({ resource, onClose, onDownload }: Props) => {
  const mode = getPreviewMode(resource);
  const label = resource.title || resource.original_filename;

  // Google Docs Viewer works with any public URL (Cloudinary raw URLs are public)
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`;

  return (
    <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground truncate">{label}</p>
          {resource.description ? (
            <p className="text-sm text-muted-foreground">{resource.description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onDownload && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => onDownload(resource.id, resource.original_filename)}>
              <Download className="h-4 w-4" /> Download
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-2" onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="h-4 w-4" /> Open
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="overflow-hidden rounded-2xl border border-border bg-black">
        {mode === 'video' && (
          <video controls className="h-[420px] w-full bg-black">
            <source src={resource.url} type={resource.content_type} />
            Your browser does not support the video tag.
          </video>
        )}

        {mode === 'audio' && (
          <div className="p-6">
            <audio controls className="w-full">
              <source src={resource.url} type={resource.content_type} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {mode === 'image' && (
          <img
            src={resource.url}
            alt={label}
            className="h-[420px] w-full object-contain"
          />
        )}

        {mode === 'pdf' && (
          <iframe
            src={resource.url}
            title={label}
            className="h-[560px] w-full"
          />
        )}

        {mode === 'office' && (
          <iframe
            src={googleViewerUrl}
            title={label}
            className="h-[560px] w-full"
          />
        )}

        {mode === 'none' && (
          <div className="p-6 text-center text-sm text-muted-foreground space-y-3">
            <p>No in-browser preview available for <strong>{resource.original_filename}</strong>.</p>
            <div className="flex justify-center gap-3">
              {onDownload && (
                <Button size="sm" variant="outline" className="gap-2" onClick={() => onDownload(resource.id, resource.original_filename)}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-2" onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}>
                <ExternalLink className="h-4 w-4" /> Open in new tab
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcePreview;
