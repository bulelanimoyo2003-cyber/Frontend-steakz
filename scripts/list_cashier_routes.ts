import router from '../backend/src/routes/cashierRoutes.ts';

function listRoutes(router: any, basePath = '') {
  if (router.stack) {
    for (const layer of router.stack) {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        console.log(`${methods} ${basePath}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle) {
        listRoutes(layer.handle, basePath + (layer.regexp.source === '^\\/?$' ? '' : layer.regexp.source));
      }
    }
  }
}

listRoutes(router);
