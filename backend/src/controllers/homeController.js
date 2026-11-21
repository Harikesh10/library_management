const home = (req, res) => {
    res.status(200).json({
        message: "Welcome to my backend!",
        status: "success"
    });
};

module.exports = { home };