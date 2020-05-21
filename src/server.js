const express = require("express");
const YAML = require("yaml");
const fs = require("fs");
var bodyParser = require("body-parser");
const cors = require('cors');
const app = express();
const chalk = require('chalk');
let httpServer;

app.use(cors());

function createServer(portNumber, dbPath) {
  
  const port = portNumber || 3000;

  app.use(bodyParser.json());

  // read yml file
  const content = fs.readFileSync(dbPath, { encoding: "utf8" });
  const doc = YAML.parseDocument(content);
  const json = doc.toJSON();
  const routes = Object.keys(json);
  const routesString = routes.reduce((acc, curr) => {
    return `${acc} GET /${curr} \n GET /${curr}/:id \n PUT /${curr} \n DELETE /${curr}/:id \n\n`;
  }, "");

  const routeDefault = (req, res) => res.send(`Welcome to YAML Server \n
Routes available are: \n
${routesString}
`)

  function setupRoutesForResource(route) {
    app.get(`/${route}`, (req, res) => routeGet(req, res, route));
    app.get(`/${route}/:id`, (req, res) => routeGetWithParam(req, res, route));
    app.post(`/:newRoute/new`, (req, res) => routeNewResource(req, res, route));
    app.post(`/${route}`, (req, res) => routePost(req, res, route));
    app.put(`/${route}`, (req, res) => routePut(req, res, route));
    app.delete(`/${route}/:id`, (req, res) => routeDelete(req, res, route));
  } 

  function routeGet(req, res, route) {
    const page = req.query.page;
    const pageSize = req.query.pageSize;

    if (/\d+/.test(page) && /\d+/.test(pageSize)) {
      const pageNo = +page;
      const pageSizeNo = +pageSize;
      const start = pageSizeNo * (+pageNo - 1);
      const end = start + pageSizeNo;
      res.json(json[route].slice(start, end));
    }

    res.json(json[route]);
  }

  function routeGetWithParam(req, res, route) {
    const foundItem = json[route].find((item) => item.id == req.params.id);
    if (!foundItem) {
      res.statusCode = 404;
      res.json({});
    } else {
      res.json(foundItem);
    }
  }

  function routeNewResource(req, res, route) {
    const { newRoute } = req.params;

    if (!json[newRoute]) {
      json[newRoute] = { ...req.body, id: 1 };
      setupRoutesForResource(newRoute)
      fs.writeFileSync(dbPath, YAML.stringify(json));
      res.statusCode = 201;
      res.json({ ...req.body, id: 1 });
    } else {
      res.statusCode = 400;
      res.send(`/${newRoute} already exist`);
    }
  }

  function routePost(req, res, route) {
    const posted = { ...req.body, id: 0 };

    if (json[route].length > 0) {
      const [firstItem] = json[route];
      const props = [...Object.keys(firstItem)].sort();
      const postedProps = Object.keys(posted).sort();

      if (JSON.stringify(props) !== JSON.stringify(postedProps)) {
        res.statusCode = 400;
        res.send("");
      }
    }

    const insertObject = { ...posted, id: json[route].length + 1 };

    json[route].push(insertObject);
    fs.writeFileSync(dbPath, YAML.stringify(json));
    res.statusCode = 201;
    res.json(insertObject);
  }

  function routePut(req, res, route) {
    const posted = req.body;
    let foundItem;
    json[route] = json[route].map((item) => {
      if (item.id === +posted.id) {
        foundItem = item;
        return { ...item, ...posted };
      }
      return item;
    });
    if (foundItem) {
      fs.writeFileSync(dbPath, YAML.stringify(json));
      res.json({ ...foundItem, ...posted });
    } else {
      res.statusCode = 404;
      res.send("Item not found with ID" + posted.id);
    }
  }

  function routeDelete(req, res, route) {
      let deletedItem;
      json[route] = json[route].filter((item) => {
        if (item.id === +req.params.id) {
          deletedItem = item;
        }
        return item.id !== +req.params.id;
      });
      fs.writeFileSync(
        dbPath,
        YAML.stringify(json)
      );
      return res.json(deletedItem);
    }

  app.get("/", routeDefault)

  routes.forEach(setupRoutesForResource);

  httpServer = app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
    console.log(chalk.greenBright(routesString));
  });
}

function getHttpServer() {
  return httpServer;
}

module.exports = {
  createServer,
  server: app,
  getHttpServer
};
