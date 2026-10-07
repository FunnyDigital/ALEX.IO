const config = require('../config');

module.exports = config.isDemo ? require('./memoryStore') : require('./firestoreStore');
