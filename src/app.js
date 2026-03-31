import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true, // to allow cookies to be sent in cross-origin requests
    successStatus: 200 // for legacy browser support
}
));

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

export default app;



//why we are using cookie parser?
// because we want to be able to read cookies in our routes, for example, when we want to check if a user is authenticated, we can read the token from the cookie and verify it.
//why we are using cors?
// because we want to allow our frontend to make requests to our backend, and if we don"t use cors, the browser will block the requests because of the same-origin policy.
//CORS (Cross-Origin Resource Sharing) whitelisting :  is a security mechanism where a server explicitly lists trusted domains in the Access-Control-Allow-Origin header, allowing only those domains to access its resources. It acts as a safety barrier, restricting unauthorized websites from making cross-origin API requests, thus preventing malicious cross-site activity.