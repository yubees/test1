import express from "express";
import  "dotenv/config";
import bodyParser from "body-parser";
import postRoute from "../src/routes/post.route";
import authRoute from "../src/routes/auth.route";
import cors from "cors";
import session from "express-session";





const app = express();
const port = process.env.PORT;



app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.API!,
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/auth", authRoute);
app.use("/post", postRoute);




app.listen(port, async () => {
    try {
      console.log(`Server is running on port ${port}`);
  
      app.get("/", (req, res) => {
        res.send("server running !!");
      });
    } catch (error) {
      console.log("Error");
    }
  });
