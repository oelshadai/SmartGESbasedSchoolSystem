import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Scissors } from 'lucide-react';

interface Props {
  file: File;
  onTrimmed: (blob: Blob, filename: string) => void;
  onCancel: () => void;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function VideoTrimmer({ file, onTrimmed, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [trimming, setTrimming] = useState(false);
  const [progress, setProgress] = useState(0);
  const objectUrl = useRef<string>('');

  useEffect(() => {
    objectUrl.current = URL.createObjectURL(file);
    const video = videoRef.current!;
    video.src = objectUrl.current;
    video.onloadedmetadata = () => {
      setDuration(video.duration);
      setEndTime(video.duration);
    };
    return () => URL.revokeObjectURL(objectUrl.current);
  }, [file]);

  // Seek preview when handles change
  useEffect(() => {
    if (videoRef.current) videoRef.current.currentTime = startTime;
  }, [startTime]);

  const handleTrim = useCallback(async () => {
    const video = videoRef.current!;
    setTrimming(true);
    setProgress(0);

    try {
      // Capture the video stream and record only the trimmed segment
      const stream = (video as any).captureStream
        ? (video as any).captureStream()
        : (video as any).mozCaptureStream();

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const trimDuration = endTime - startTime;

      await new Promise<void>((resolve, reject) => {
        recorder.onstop = () => resolve();
        recorder.onerror = () => reject(new Error('Recording failed'));

        video.currentTime = startTime;
        video.playbackRate = 1;

        video.onseeked = () => {
          recorder.start(100);
          video.play();

          const interval = setInterval(() => {
            const elapsed = video.currentTime - startTime;
            setProgress(Math.min(100, Math.round((elapsed / trimDuration) * 100)));
            if (video.currentTime >= endTime) {
              clearInterval(interval);
              video.pause();
              recorder.stop();
            }
          }, 200);
        };
      });

      const blob = new Blob(chunks, { type: mimeType });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const name = file.name.replace(/\.[^.]+$/, `_trimmed.${ext}`);
      onTrimmed(blob, name);
    } catch {
      setTrimming(false);
    }
  }, [file, startTime, endTime, onTrimmed]);

  const trimDuration = endTime - startTime;

  return (
    <div className="flex flex-col gap-4">
      <video
        ref={videoRef}
        className="w-full rounded-xl bg-black max-h-48 object-contain"
        controls
        preload="metadata"
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Start: {fmt(startTime)}</span>
          <span className="text-primary font-medium">Clip: {fmt(trimDuration)}</span>
          <span>End: {fmt(endTime)}</span>
        </div>

        {/* Start handle */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Start point</label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={startTime}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (v < endTime - 1) setStartTime(v);
            }}
            className="w-full accent-primary"
          />
        </div>

        {/* End handle */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">End point</label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={endTime}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (v > startTime + 1) setEndTime(v);
            }}
            className="w-full accent-primary"
          />
        </div>

        {/* Visual trim bar */}
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute h-full bg-primary/30"
            style={{ left: `${(startTime / duration) * 100}%`, width: `${(trimDuration / duration) * 100}%` }}
          />
          {trimming && (
            <div
              className="absolute h-full bg-primary transition-all"
              style={{ left: `${(startTime / duration) * 100}%`, width: `${((trimDuration * progress) / 100 / duration) * 100}%` }}
            />
          )}
        </div>

        {trimming && (
          <p className="text-xs text-muted-foreground text-center">Trimming… {progress}%</p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={trimming}>
          Use original
        </Button>
        <Button type="button" size="sm" onClick={handleTrim} disabled={trimming || duration === 0} className="gap-2">
          {trimming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
          Trim & use
        </Button>
      </div>
    </div>
  );
}
