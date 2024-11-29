import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT;





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