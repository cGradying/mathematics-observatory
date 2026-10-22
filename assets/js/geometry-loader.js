let runtimePromise;

window.addEventListener('geometry-visualizer-request', () => {
  runtimePromise ||= import('./geometry-visualizer.js')
    .then(({ createGeometryVisualizer }) => {
      window.createGeometryVisualizer = createGeometryVisualizer;
      window.geometryVisualizerError = null;
    })
    .catch(error => {
      window.geometryVisualizerError = error;
    })
    .finally(() => window.dispatchEvent(new CustomEvent('geometry-visualizer-ready')));
});

window.dispatchEvent(new CustomEvent('geometry-loader-ready'));
