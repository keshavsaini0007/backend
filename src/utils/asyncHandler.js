import asyncHandler from 'express-async-handler';

// method 2

const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve( requestHandler(req, res, next) ).catch((error) => { next(error); });
    }
};

export default asyncHandler;

//method 1

// const asyncHandler = (fn) => {
//     async (req, res, next) => {
//         try {
//             await fn(req, res, next);
//         } catch (error) {
//             res.status(error.status || 500).json({
//                 success: false,
//                 message: error.message || "Internal Server Error"
//             });
//         }
//     }
// }

// what is asyncHandler function and why?
// in short, asyncHandler is a higher-order function that wraps an asynchronous function (like an Express route handler) and automatically catches any errors that occur within it. This eliminates the need for repetitive try-catch blocks in each route handler, making the code cleaner and more maintainable. When an error is caught, it sends a standardized JSON response with the error message and status code.



// what are higher order functions in JavaScript?
// that can take other functions as arguments or return functions as their result. In JavaScript, functions are first-class citizens, which means they can be treated like any other value (such as numbers, strings, etc.). This allows for powerful programming techniques and patterns.

