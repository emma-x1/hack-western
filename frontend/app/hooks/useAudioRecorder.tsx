import { useEffect, useState } from "react";

export const useAudioRecorder = ({ onAudioRecorded }: { onAudioRecorded: (audioBlob: Blob) => void }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    
    useEffect(() => {
      console.log("STARTING!!")
    }, [])

    const startRecording = async () => {
      try {
        console.log("Requesting microphone access")
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Microphone access granted.")
        const recorder = new MediaRecorder(stream);

        let chunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          chunks.push(event.data);
          console.log("NEW DATA BEING ADDED!!!!");
        };

        recorder.onstop = () => {
          console.log("AUDIO CHUNKS!!!!");
          const audioBlob = new Blob(chunks, { type: "audio/webm" });
          console.log("Recording stopped. Audio Blob:", audioBlob)
          onAudioRecorded(audioBlob); // Pass the audio blob to the callback
        };  

        recorder.start();
        setMediaRecorder(recorder);
        console.log("RESETTING TO EMPTY!!!!");
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Could not access the microphone. Please check your permissions.");
        }
      };

      const stopRecording = () => {
        if (mediaRecorder) {
          mediaRecorder.stop();
          setIsRecording(false);
          console.log("Stopping recording...");
        } else {
          console.error("No active media recording found.");
        }
      };

      return { isRecording, startRecording, stopRecording };
      };