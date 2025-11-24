// Response handler
export const sendResponse = (res, statusCode, data) => {
  return res.status(statusCode).json(data);
};

export const sendSuccess = (
  res,
  data,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res,
  message = "Something went wrong",
  statusCode = 500,
  errors = null
) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

// Pagination helper
export const getPagination = (page = 1, limit = 10) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip,
  };
};

export const formatPaginationResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      limit: parseInt(limit, 10),
    },
  };
};

// Async handler wrapper (to avoid try-catch in every controller)
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Filter object helper
export const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};
