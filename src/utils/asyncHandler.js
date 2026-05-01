const asyncHandler = (fn) => {
    return (req, res, next) => {
        console.log("🔥 asyncHandler triggered");
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// const asyncHandler = () => {}
// const asyncHandler = (function) => () => {}
// const asyncHandler =  (function) => async()=>{}
/*const asyncHandler = (fn) => async(req, res, next) =>{
    try {
        await fn(req,res,next)
        
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}*/

export {asyncHandler}
