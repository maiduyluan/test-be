const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);

// parse application/json
app.use(bodyParser.json());

// fix cors
const io = new Server(server, {
  cors: {
    origin: true,
  },
});

// fix cors
app.use(
  cors({
    origin: true,
  })
);

//create connect my sql
const mysqlConnection = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "luan123",
  database: "Blog_db",
});

//connect mysql
mysqlConnection.connect((err) => {
  !err
    ? console.log("DB connection success")
    : console.log("DB connection fail: " + JSON.stringify(err, undefined));
});

//get blog by params page
app.get("/blogs", (req, res) => {
  const page = req.query.page;
  mysqlConnection.query(
    `SELECT * FROM Blog ORDER BY BlogID LIMIT ${page * 10},10`,
    (err, rows, fields) => {
      !err ? res.send(rows) : console.log(err);
    }
  );
});

//get user blog by id
app.get("/blogs/:id", (req, res) => {
  mysqlConnection.query(
    "SELECT * FROM Blog WHERE BlogID = ?",
    [req.params.id],
    (err, rows, fields) => {
      !err ? res.send(rows) : console.log(err);
    }
  );
});

//update like
app.put("/blogs/:id", (req, res) => {
  mysqlConnection.query(
    "UPDATE Blog SET `Like` = ? WHERE `BlogID` = ?",
    [req.body.Like, req.params.id],
    (err, result) => {
      !err
        ? res.status(200).send("Like updated successfully")
        : console.log("error");
    }
  );
});

//post new blog 
app.post("/blogs", async (req, res) => {
  const { Name, Title, Like, Comment, Image } = req.body;
  try {
    const result = await mysqlConnectionAsync(
      "INSERT INTO blog (`Title`, `Name`, `Image`, `Like`, `Comment`) VALUES (?, ?, ?, ?, ?)",
      [Title, Name, Image, Like, Comment]
    );
    const id = result.insertId;
    const data = await getBlogById(id);
    
    //emit to client new blog
    io.emit("client-have-new-blog", data);
    res.json({ status: "ok", data: data });
  } catch (error) {
    res.json({ status: "fail", error });
  }
});

io.on("connection", (socket) => {});

//listen port 3001
server.listen(3001, () =>
  console.log("Express server is running at port: 3001")
);

//get id user new blog
function getBlogById(id) {
  return new Promise((resolve, reject) => {
    mysqlConnection.query(
      "SELECT * FROM blog where BlogID = ?",
      id,
      (err, result) => {
        if (!!err) {
          reject(err);
          return;
        }
        resolve(result[0]);
      }
    );
  });
}

//make custom connect to wrap
function mysqlConnectionAsync(sql, params) {
  return new Promise((resolve, reject) => {
    mysqlConnection.query(sql, params, (err, result) => {
      if (!!err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
