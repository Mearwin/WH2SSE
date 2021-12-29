const path = require('path')
const Stream = require('stream');
const EventEmitter = require('events');

const argv = require('minimist')(process.argv.slice(2));

// Koa
const Koa = require('koa');
const serve = require('koa-static')
const mount = require('koa-mount')
const bodyParser = require('koa-bodyparser')

const eventEmitter = new EventEmitter();

if (argv.v) {
  eventEmitter.on('event', (event) => {
    console.log('Logging listener', event);
    console.log('Nb listeners: ', eventEmitter.listeners('event').length);
  });
}

if (argv.t) {
  setInterval(() => {
    const data = `date: ${Date.now()}`;
    eventEmitter.emit('event', data);
  }, 1000);
}

const listen = (eventEmitter) => {
  const stream = new Stream.Readable({
    read() {}
  });
  const listener = (event) => stream.push(`data: ${event}\n\n`);

  eventEmitter.on('event', listener);

  stream.on("close", () => {
    eventEmitter.off("event", listener);
  });

  return stream;
}

const static = serve(path.join(__dirname, '/static'));

const connect = async (ctx, next) => {
  console.log('Recieved connect');

  applySSEHeaders(ctx);

  ctx.status = 200;
  ctx.body = listen(eventEmitter);
  
};

const applySSEHeaders = (ctx) => {
  ctx.req.socket.setTimeout(0);
  ctx.req.socket.setNoDelay(true);
  ctx.req.socket.setKeepAlive(true);
  ctx.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
}

const hooks = async (ctx, next) => {
  if (argv.v) console.log(`Received hook: ${ctx.request.body}`)
  eventEmitter.emit('event', `${ctx.request.body}`);
  ctx.status = 200;
}

const health = async (ctx, next) => {
  ctx.status = 200;
  ctx.body = { 
    nbListeners: eventEmitter.listeners('event').length,
    ...process.memoryUsage()
  };
}

const app = new Koa();
app.use(bodyParser({ enableTypes: ['json', 'text'] }));
app.use(mount('/', static));
app.use(mount('/connect', connect));
app.use(mount('/hooks', hooks));
app.use(mount('/health', health));
app.listen(3010);
console.log('Http server running on 3010')
console.log('Serving test page on: http://localhost:3010/test.html')
console.log('Serving health check on: http://localhost:3010/health')