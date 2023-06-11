import React, { useEffect, useState, useRef } from "react";
import { scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { line } from "d3-shape";

const DOWNSAMPLING_FACTOR = 50; // adjust this to change the amount of downsampling
const MAX_SAMPLES = 5000; // Set this to the maximum number of samples you want to visualize at once

const RecordingWaveform: React.FC<{ stream: MediaStream | null }> = ({
  stream,
}) => {
  const [audioSamples, setAudioSamples] = useState<Float32Array>(
    new Float32Array()
  );

  const svgRef = useRef<SVGSVGElement | null>(null); // Reference to the svg element for d3 to render to

  useEffect(() => {
    if (!stream) {
      setAudioSamples(new Float32Array());
    }
  }, [stream]);

  useEffect(() => {
    const audioCtx = new AudioContext();
    const setupWorklet = async (currentStream: MediaStream) => {
      await audioCtx.audioWorklet.addModule("/audioWorklet.js");
      const source = audioCtx.createMediaStreamSource(currentStream);
      const workletNode = new AudioWorkletNode(audioCtx, "audio-worklet");

      source.connect(workletNode);
      workletNode.connect(audioCtx.destination);
      workletNode.port.onmessage = (event) => {
        const eventSamples: Float32Array = new Float32Array(event.data);

        setAudioSamples((prevSamples) => {
          const downsampledEventSamples = new Float32Array(
            Array.from(
              { length: Math.floor(eventSamples.length / DOWNSAMPLING_FACTOR) },
              (_, i) => eventSamples[i * DOWNSAMPLING_FACTOR]
            )
          );

          const newSamples = new Float32Array(
            prevSamples.length + downsampledEventSamples.length
          );
          newSamples.set(prevSamples);
          newSamples.set(downsampledEventSamples, prevSamples.length);
          return newSamples;
        });
      };
    };

    if (stream) {
      setupWorklet(stream).catch((err) => console.error(err));
    }

    return () => {
      audioCtx.close().catch((err) => console.error(err));
    };
  }, [stream]);

  useEffect(() => {
    if (audioSamples.length > 0 && svgRef.current) {
      const svg = select(svgRef.current);
      const visibleSamples = audioSamples.slice(
        Math.max(audioSamples.length - MAX_SAMPLES, 0)
      );

      const xScale = scaleLinear()
        .domain([0, visibleSamples.length - 1])
        .range([0, 800]); // width of the svg

      const yScale = scaleLinear().domain([-1, 1]).range([300, 0]); // height of the svg

      const lineGenerator = line<number>()
        .x((_d: number, i: number) => xScale(i))
        .y((d: number) => yScale(d));

      const pathData = lineGenerator(Array.from(visibleSamples));

      svg
        .selectAll("path")
        .data([pathData])
        .join("path")
        .attr("d", (d) => d || "")
        .attr("stroke", "steelblue")
        .attr("fill", "none");
    }
  }, [audioSamples]);

  return <svg ref={svgRef} width="800" height="300" viewBox={`0 0 800 300`} />;
};

export default RecordingWaveform;
