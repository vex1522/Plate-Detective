'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { extractPlateNumber } from '@/ai/flows/extract-plate-number';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [plateNumber, setPlateNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isDetectingFromVideo, setIsDetectingFromVideo] = useState(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePlateDetection = async () => {
    if (!image) {
      toast({
        title: 'Error',
        description: 'Please upload an image first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await extractPlateNumber({ photoDataUri: image });
      setPlateNumber(result.plateNumber);
      toast({
        title: 'Plate Detected!',
        description: 'The plate has been successfully detected.',
      });
    } catch (error: any) {
      console.error('Error detecting plate:', error);
      toast({
        title: 'Error',
        description: 'Failed to detect plate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoPlateDetection = async () => {
    if (!videoRef.current) {
      toast({
        title: 'Error',
        description: 'Camera not initialized. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsDetectingFromVideo(true);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const videoFrameDataUri = canvas.toDataURL('image/jpeg');

    try {
      const result = await extractPlateNumber({ photoDataUri: videoFrameDataUri });
      setPlateNumber(result.plateNumber);
      toast({
        title: 'Plate Detected from Video!',
        description: 'The plate was detected successfully from the video feed.',
      });
    } catch (error: any) {
      console.error('Error detecting plate from video:', error);
      toast({
        title: 'Error',
        description: 'Failed to detect plate from video. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDetectingFromVideo(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-8 bg-gradient-to-br from-pd-soft-accent via-pd-secondary to-white animate-fade-in">
      <h1 className="text-4xl font-extrabold text-primary mb-8 animate-bounce">🚗 Plate Detective</h1>

      <Card className="w-full max-w-lg shadow-lg rounded-2xl overflow-hidden bg-white hover:shadow-2xl transition-shadow duration-300">
        <CardHeader className="py-6 px-8 bg-accent text-white">
          <CardTitle className="text-2xl font-bold animate-fade-in-up">Upload Car Image</CardTitle>
          <CardDescription className="text-gray-200 animate-fade-in">Detect the number plate from an image.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-6 p-8">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="file-input file-input-bordered w-full bg-soft-accent p-2 rounded-md transition hover:bg-highlight"
          />
          {image && (
            <div className="relative w-full rounded-lg overflow-hidden shadow-md animate-fade-in-up">
              <img src={image} alt="Uploaded Car" className="w-full object-cover aspect-video" />
            </div>
          )}
          <Button
            onClick={handlePlateDetection}
            disabled={isLoading}
            className="w-full bg-highlight hover:bg-yellow-400 text-foreground font-bold py-3 px-6 rounded-lg transition-all animate-pulse"
          >
            {isLoading ? 'Detecting...' : 'Detect Plate from Image'}
          </Button>

          <div className="relative w-full rounded-lg overflow-hidden animate-fade-in">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
            {!hasCameraPermission && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
              </Alert>
            )}
          </div>

          <Button
            onClick={handleVideoPlateDetection}
            disabled={isDetectingFromVideo || !hasCameraPermission}
            className="w-full bg-accent hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-all animate-bounce"
          >
            {isDetectingFromVideo ? 'Detecting...' : 'Detect Plate from Video'}
          </Button>

          {plateNumber && (
            <div className="mt-6 p-6 bg-soft-accent rounded-xl shadow-inner animate-fade-in">
              <h2 className="text-2xl font-semibold text-primary mb-2">Detected Plate:</h2>
              <p className="text-lg">{plateNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
