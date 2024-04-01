import express, { ErrorRequestHandler } from 'express';
import * as bodyParser from 'body-parser';
import { loggingMiddleware } from './modules/logger';

// const royaltyManagerRoutes = require('./routes/royalty_manager');

const init = () => {
  const app = express();
  app.disable('x-powered-by');
  app.use(bodyParser.json());
  app.use(loggingMiddleware);

  // // Injects the logger and the store in the context
  // app.use((req, res, next) => {
  //   req.logger = logger.child({ requestIdentifier: uuidv4() });
  //   req.store = store;
  //   next();
  // });

  app.get('/status', (req, res) => {
    req.log.info('Hellow world');
    res.status(200).send('Service Alive');
  });
  // app.use('/docs', express.static('docs'));
  // app.use('/royaltymanager', royaltyManagerRoutes);

  const errorHandler: ErrorRequestHandler = (_, __, res, next) => {
    res.status(500).send('Internal server error');
    next();
  };

  app.use(errorHandler);

  return app;
};

export = init;
