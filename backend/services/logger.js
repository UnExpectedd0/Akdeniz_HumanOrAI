const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const logFile = path.join(logsDir, 'server.log');

// ANSI Color Codes for terminal
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    crimson: "\x1b[38m"
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    crimson: "\x1b[48m"
  }
};

const getTimestamp = () => {
    return new Date().toLocaleString('tr-TR', { timeZone: 'UTC' });
};

const formatMessage = (level, message, color) => {
    const timestamp = getTimestamp();
    const plain = `[${timestamp}] ${level}: ${message}`;
    const colored = `${colors.dim}[${timestamp}]${colors.reset} ${color}${level}${colors.reset}: ${message}`;
    return { plain, colored };
};

const writeToFile = (message) => {
    fs.appendFileSync(logFile, message + '\n');
};

const logger = {
    info: (message) => {
        const { plain, colored } = formatMessage('INFO', message, colors.fg.cyan);
        console.log(colored);
        writeToFile(plain);
    },
    success: (message) => {
        const { plain, colored } = formatMessage('SUCCESS', message, colors.fg.green);
        console.log(colored);
        writeToFile(plain);
    },
    warn: (message) => {
        const { plain, colored } = formatMessage('WARN', message, colors.fg.yellow);
        console.log(colored);
        writeToFile(plain);
    },
    milestone: (message) => {
        const { plain, colored } = formatMessage('MILESTONE', message, colors.bright + colors.fg.cyan);
        console.log(colored);
        writeToFile(plain);
    },
    error: (message, err) => {
        const errorDetail = err ? (err.stack || err) : '';
        const { plain, colored } = formatMessage('ERROR', `${message} ${errorDetail}`, colors.fg.red);
        console.error(colored);
        writeToFile(plain);
    },
    http: (req, res, responseTime) => {
        const status = res.statusCode;
        const color = status >= 500 ? colors.fg.red : status >= 400 ? colors.fg.yellow : colors.fg.green;
        const message = `${req.method} ${req.originalUrl} ${color}${status}${colors.reset} - ${responseTime}ms`;
        const { plain } = formatMessage('HTTP', `${req.method} ${req.originalUrl} ${status} - ${responseTime}ms`, colors.fg.magenta);
        console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.fg.magenta}HTTP${colors.reset}: ${message}`);
        writeToFile(plain);
    }
};

module.exports = logger;
