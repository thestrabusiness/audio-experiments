import React, { useState, useEffect, useRef } from "react";
import RecordingWaveform from "./RecordingWaveform";

enum RecordingState {
  Inactive = "inactive",
  Recording = "recording",
  Recorded = "recorded",
}

type AudioRecorderProps = {};

const AudioRecorder: React.FC<AudioRecorderProps> = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>(
    RecordingState.Inactive
  );

  const [audioURL, setAudioURL] = useState<string | undefined>(undefined);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [currentStream, setStream] = useState<MediaStream | null>(null);

  const audioChunksRef = useRef<Blob[]>(audioChunks);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    audioChunksRef.current = audioChunks;
  }, [audioChunks]);

  useEffect(() => {
    if (recordingState === RecordingState.Recording) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const newMediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = newMediaRecorder;
        setStream(stream);
        newMediaRecorder.start(500);
      });
    } else if (
      recordingState === RecordingState.Recorded ||
      recordingState === RecordingState.Inactive
    ) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
      setStream(null);
    }
  }, [recordingState]);

  const startRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(undefined);
    }
    setAudioChunks([]);
    setRecordingState(RecordingState.Recording);
  };

  const stopRecording = () => {
    setRecordingState(RecordingState.Recorded);
  };

  useEffect(() => {
    if (mediaRecorderRef.current && currentStream) {
      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.ondataavailable = (e) => {
        setAudioChunks((prevAudioChunks) => [...prevAudioChunks, e.data]);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current);
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        setRecordingState(RecordingState.Recorded);
        currentStream.getTracks().forEach((track) => track.stop());
        setStream(null);
      };
    }
  }, [currentStream]);

  const controlButtonText = () => {
    switch (recordingState) {
      case RecordingState.Inactive:
        return "Start Recording";
      case RecordingState.Recording:
        return "Stop Recording";
      case RecordingState.Recorded:
        return "Restart";
    }
  };

  const handleOnClickControlButton = () => {
    switch (recordingState) {
      case RecordingState.Inactive:
        startRecording();
        break;
      case RecordingState.Recording:
        stopRecording();
        break;
      case RecordingState.Recorded:
        startRecording();
        break;
    }
  };

  return (
    <div>
      <RecordingWaveform stream={currentStream} />
      <div className="flex flex-col justify-center items-center">
        <div
          className="rounded-lg bg-blue-300 py-2.5 p-4 mb-2"
          onClick={handleOnClickControlButton}
        >
          {controlButtonText()}
        </div>
        {recordingState === RecordingState.Recorded && (
          <audio src={audioURL} controls>
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
