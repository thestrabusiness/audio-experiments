import React, { useRef, useEffect, useState } from "react";

const AudioVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();

      source.connect(analyserNode);

      setAudioContext(audioCtx);
      setAnalyser(analyserNode);
      setDataArray(new Uint8Array(analyserNode.frequencyBinCount));
    });
  }, []);

  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);

  useEffect(() => {
    const draw = () => {
      if (canvasRef.current && dataArray && analyser) {
        const canvas = canvasRef.current;
        const height = canvas.height;
        const width = canvas.width;
        const context = canvas.getContext("2d");
        if (context) {
          context.clearRect(0, 0, width, height); // Clear the canvas

          // Get the new data
          analyser.getByteTimeDomainData(dataArray);

          context.fillStyle = "rgb(200, 200, 200)"; // Draw gray background
          context.fillRect(0, 0, width, height);

          context.lineWidth = 2;
          context.strokeStyle = "rgb(0, 0, 0)"; // Draw black wave

          context.beginPath();

          let sliceWidth = (width * 1.0) / dataArray.length;
          let x = 0;

          for (let i = 0; i < dataArray.length; i++) {
            let v = dataArray[i] / 128.0;
            let y = (v * height) / 2;

            if (i === 0) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
            }

            x += sliceWidth;
          }

          context.lineTo(canvas.width, canvas.height / 2);
          context.stroke();

          // Request the next frame
          requestAnimationFrame(draw);
        }
      }
    };

    draw();
  }, [dataArray, analyser]);

  return <canvas ref={canvasRef} />;
};

export default AudioVisualizer;
