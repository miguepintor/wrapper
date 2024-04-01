import Logger, {
  stdSerializers,
  LogLevelString,
  createLogger,
  LogLevel,
  LoggerOptions,
  WriteFn,
} from 'bunyan';
import { RequestHandler } from 'express';
import { WriteStream } from 'tty';
import { LOG_LEVEL, SERVICE_NAME } from '../config';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      log: Logger;
    }
  }
}

type ValidLogLevels = {
  [key in LogLevelString]: LogLevelString;
};

type GoogleLogLevelMapper = {
  [key in number]: string;
};

const validLogLevels: ValidLogLevels = {
  trace: 'trace',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal',
};

const VALIDATED_LOG_LEVEL: LogLevelString = validLogLevels[LOG_LEVEL as LogLevelString] || 'info';

const validateLogLevel = (logLevel?: string):
LogLevelString => validLogLevels[logLevel as LogLevelString] || VALIDATED_LOG_LEVEL;

const logLevelMapper: GoogleLogLevelMapper = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'ERROR',
};

const coreFields = [
  'v',
  'level',
  'name',
  'hostname',
  'pid',
  'time',
  'msg',
  'src',
];

const encoder = (stream: WriteStream): WriteFn => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  write(rec: any) {
    const modifiedRec = {
      ...rec,
      severity: logLevelMapper[rec.level],
      message: rec.msg,
    };
    const error = rec.err || rec.error;
    delete modifiedRec.err;
    if (error) {
      if (!modifiedRec.message) {
        modifiedRec.message = error.message || error.stack;
      }
      modifiedRec.error = { stack: error.stack };
      if (error.message) {
        modifiedRec.error.message = error.message;
      }
    }
    coreFields.forEach((field) => delete modifiedRec[field]);
    stream.write(`${JSON.stringify(modifiedRec)}\n`);
  },
});

const options = (level: LogLevel, stream: WriteStream): LoggerOptions => ({
  name: SERVICE_NAME,
  streams: [
    {
      level,
      stream: encoder(stream),
      type: 'raw',
    },
  ],
  serializers: {
    res: stdSerializers.res,
    req: stdSerializers.req,
  },
});

const logger = createLogger(options(VALIDATED_LOG_LEVEL, process.stdout));

const loggingMiddleware: RequestHandler = (req, _res, next) => {
  const logLevel = req.get('log-level') || req.get('x-log-level');
  req.log = logger.child({
    level: validateLogLevel(logLevel),
  });
  next();
};

export { logger, validateLogLevel, loggingMiddleware };
