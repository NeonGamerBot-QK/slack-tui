import http from "http";
const server = http.createServer((req, res) => {
  // pipe body to console
  req.pipe(process.stdout);
  res.end();
});

server.listen(3000);
