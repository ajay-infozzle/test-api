import express from "express";
import cors from "cors";

const app = express();

app.use(cors({
    origin: "*",
    credentials: true
}));

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));


//~ routes import
import initialRouter from "./src/routes/initial_route.js";
import userRouter from "./src/routes/user_route.js";
import postRouter from "./src/routes/post_route.js";

//~ routes declration
app.use("/api/v1/test" , initialRouter);
app.use("/api/v1/user" , userRouter);
app.use("/api/v1/post" , postRouter);

//~ test dynamic linking
// app.get('/p/:shortId', async (req, res) => {
//     const title = "Test Dynamic Linking";
//     const description = "This is test api for dynamic link";
//     const image = "https://images.unsplash.com/photo-1739219959019-dd317f76c7e8?q=80&w=2058&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"; 
//     const fallbackUrl = `https://test-dynamic-link.onrender.com/p/${req.params.shortId}`;
//     const appUrl = `testapp://post/${req.params.shortId}`;
//     const playStoreUrl = "https://play.google.com/store/apps/details?id=com.mourya.notescribe";

//     res.send(`
//         <html>
//         <head>
//             <meta property="og:title" content="${title}">
//             <meta property="og:description" content="${description}">
//             <meta property="og:image" content="${image}">
//             <meta property="og:url" content="${fallbackUrl}">
//             <meta property="og:type" content="article">
//             <title>${title}</title>
//             <script>
//                 function openApp() {
//                     window.location.href = "${appUrl}";
//                     setTimeout(() => {
//                         window.location.href = "${playStoreUrl}";
//                     }, 100); 
//                 }
//                 openApp();
//             </script>
//         </head>
//         <body>
//             <h1>Redirecting...</h1>
//             <p>If the app doesn't open, <a href="${fallbackUrl}">click here</a>.</p>
//         </body>
//         </html>
//     `);
// });


app.get('/p/:shortId', async (req, res) => {
    const title = "Test Dynamic Linking";
    const description = "This is a test API for dynamic link";
    const image = "https://images.unsplash.com/photo-1739219959019-dd317f76c7e8?q=80&w=2058&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

    const fallbackUrl = `https://test-dynamic-link.onrender.com/p/${req.params.shortId}`;
    const appUrl = `testapp://post/${req.params.shortId}`; // Deep link for app
    const appStoreUrl = "https://apps.apple.com/app/idYOUR_APPLE_ID"; // Replace with your App Store link
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.mourya.notescribe";

    res.send(`
        <html>
        <head>
            <meta property="og:title" content="${title}">
            <meta property="og:description" content="${description}">
            <meta property="og:image" content="${image}">
            <meta property="og:url" content="https://test-dynamic-link.onrender.com/p/${req.params.shortId}">
            <meta property="og:type" content="article">
            <script>
                function openApp() {
                    var userAgent = navigator.userAgent || navigator.vendor;
                    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                        // iOS device detected
                        window.location.href = "${appUrl}";
                        setTimeout(() => {
                            window.location.href = "${appStoreUrl}"; // Redirect to App Store if not installed
                        }, 100);
                    } else if (/android/i.test(userAgent)) {
                        // Android device detected
                        window.location.href = "${appUrl}";
                        setTimeout(() => {
                            window.location.href = "${playStoreUrl}"; // Redirect to Play Store if not installed
                        }, 2000);
                    }
                }
                openApp();
            </script>
        </head>
        <body>
            <h1>Redirecting...</h1>
            <p>If the app doesn't open, <a href="${appStoreUrl}">download from App Store</a> or <a href="${playStoreUrl}">download from Play Store</a>.</p>
        </body>
        </html>
    `);
});



export { app } ;