let model = null;

onmessage = async event => {
  try {
    if (event.data.type === 'init') {
      importScripts(
        'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
        'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js'
      );
      await tf.setBackend('cpu');
      await tf.ready();
      model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      postMessage({ type: 'ready' });
    } else if (event.data.type === 'frame' && model) {
      const predictions = await model.detect(event.data.image, 20, 0.5);
      postMessage({ type: 'result', predictions, width: event.data.image.width, height: event.data.image.height, run: event.data.run });
    }
  } catch (error) {
    postMessage({ type: 'error', message: error.message || String(error) });
  }
};
