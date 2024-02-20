const path = require("path");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
/* const multer = require("multer"); */
// const fileUpload = require("express-fileupload");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
// const { cloudinaryConnect } = require("./config/cloudnary");
// const  cors = require("cors");

require("dotenv").config();

/* const XStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime().toString() + "-" + file.originalname);
  },
}); */
/* const filefilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}; */
const app = express();

// app.use(express.json());
// app.use(
//   fileUpload({
//     useTempFiles: true, //this middeare is for fileupload in local media;
//     tempFileDir: "/tmp",
//   })
// );

// app.use(
//   cors({
//       origin:"*",
//    credentials:true,
//   })
// )
const mongoDBstore = require("connect-mongodb-session")(session);
const store = new mongoDBstore({
  uri: process.env.DB_URL,
  collection: "sessions",
});
// cloudinaryConnect();
const errorController = require("./controllers/error");
const User = require("./models/user");
const accessLogStreams = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const { collection, db } = require("./models/user");
app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStreams }));
app.use(bodyParser.urlencoded({ extended: false }));
/* app.use(
  multer({ storage: XStorageEngine, fileFilter: filefilter }).single("image")
); */
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  session({
    secret: "myNameisJayesh",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => {
      throw new Error(err);
    });
});
app.use(flash());

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("DB Connected✅")
    app.listen(process.env.PORT || 3000,()=>{
      console.log("server started ")
    });
  })
  .catch((err) => {
    console.log(err);
  });
