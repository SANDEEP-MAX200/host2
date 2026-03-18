const errorHandler = (err, req, res) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || "Server Error",
  });
};

export default errorHandler;
