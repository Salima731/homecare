/**
 * Pagination helper
 * @param {Object} model - Mongoose model
 * @param {Object} query - Filter query
 * @param {Object} options - { page, limit, sort, populate }
 * @returns { docs, pagination }
 */
const paginate = async (model, query = {}, options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };

  let dbQuery = model.find(query).sort(sort).skip(skip).limit(limit);

  if (options.populate) {
    if (Array.isArray(options.populate)) {
      options.populate.forEach((p) => { dbQuery = dbQuery.populate(p); });
    } else {
      dbQuery = dbQuery.populate(options.populate);
    }
  }

  if (options.select) {
    dbQuery = dbQuery.select(options.select);
  }

  const [docs, total] = await Promise.all([
    dbQuery.exec(),
    model.countDocuments(query),
  ]);

  return {
    docs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

module.exports = { paginate };
