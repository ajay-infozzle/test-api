import dotenv from "dotenv";
import connectDB from "./src/db/dbConnect.js"
import { app } from "./app.js";

dotenv.config({
    path: './env'
});


// connectDB()
// .then( () =>{
//     app.on("error", (error) => {
//         console.log("ERRR: ", error);
//         throw error
//     });

//     app.listen(process.env.PORT || 8000, () => {
//         console.log(`Server is running on port : ${process.env.PORT}`);
//     });
// })
// .catch( (err) =>{
//     console.log("database connection error : ",err);
// });

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port : ${process.env.PORT}`);
});