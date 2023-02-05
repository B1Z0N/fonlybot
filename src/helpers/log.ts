import { transports, format, createLogger } from 'winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const files = new winston.transports.DailyRotateFile({
  filename: 'fonly-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  dirname: './logs/',
  level: 'debug',
  frequency: '10d',
});

export const log = createLogger({
  transports: [ new transports.Console(), files ],
  format: format.combine(
    format.timestamp({ format: 'DD.MM.YYYY HH:mm:ss' }),
    format.splat(),
    format.metadata({
      fillExcept: ['message', 'level', 'timestamp', 'label'],
    }),
    format.colorize(),
    format.printf(({ message, timestamp, level, label }) =>
      [`[${timestamp}] ${level}`, label ?? '', message].join(' ')
    )
  ),
})
