class AudioStreamWorklet extends AudioWorkletProcessor {
  process(inputs, _outputs, _parameters) {
    // inputs is an array of input channels,
    // and each channel is an array of samples
    const input = inputs[0][0];

    // Post the data to main thread
    this.port.postMessage(input);

    // Keep the processor alive
    return true;
  }
}

registerProcessor("audio-worklet", AudioStreamWorklet);
