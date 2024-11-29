import express from "express";
import  "dotenv/config";
import bodyParser from "body-parser";
import postRoute from "../src/routes/post.route";



const app = express();
const port = process.env.PORT;


app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


app.use("/post", postRoute);




app.listen(port, async () => {
    try {
      console.log(`Server is running on port ${port}`);
  
      app.get("/", (req, res) => {
        res.send("server running");
      });
    } catch (error) {
      console.log("Error");
    }
  });