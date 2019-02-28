exports.DATABASE_URL = process.env.DATABASE_URL || "mongodb://dbu:dbpass1@dsi55665.mlab.com:55665/capnode"
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-capnode';
exports.PORT = process.env.PORT || 8080;