const { db } = require('../config/firebase');
const { logger } = require('./logger');

const firebaseHelper = {
  db,
  /**
   * Get data from a reference path
   * @param {string} path 
   */
  async get(path) {
    try {
      const snapshot = await db.ref(path).once('value');
      return snapshot.val();
    } catch (error) {
      logger.error(`Firebase Helper GET error on path [${path}]:`, error);
      throw error;
    }
  },

  /**
   * Set data at a reference path (overwrites)
   * @param {string} path 
   * @param {any} data 
   */
  async set(path, data) {
    try {
      await db.ref(path).set(data);
      return data;
    } catch (error) {
      logger.error(`Firebase Helper SET error on path [${path}]:`, error);
      throw error;
    }
  },

  /**
   * Push data to a reference path (generates a unique key)
   * @param {string} path 
   * @param {any} data 
   */
  async push(path, data) {
    try {
      const ref = db.ref(path).push();
      const key = ref.key;
      // Add key to data if it is an object
      const dataToSave = typeof data === 'object' && data !== null ? { ...data, id: key } : data;
      await ref.set(dataToSave);
      return { id: key, data: dataToSave };
    } catch (error) {
      logger.error(`Firebase Helper PUSH error on path [${path}]:`, error);
      throw error;
    }
  },

  /**
   * Update data at a reference path
   * @param {string} path 
   * @param {object} data 
   */
  async update(path, data) {
    try {
      await db.ref(path).update(data);
      return data;
    } catch (error) {
      logger.error(`Firebase Helper UPDATE error on path [${path}]:`, error);
      throw error;
    }
  },

  /**
   * Remove data at a reference path
   * @param {string} path 
   */
  async remove(path) {
    try {
      await db.ref(path).remove();
      return true;
    } catch (error) {
      logger.error(`Firebase Helper REMOVE error on path [${path}]:`, error);
      throw error;
    }
  },

  /**
   * Query data ordered by child key
   * @param {string} path 
   * @param {string} childKey 
   * @param {any} equalToValue 
   */
  async queryByChild(path, childKey, equalToValue) {
    try {
      const snapshot = await db.ref(path)
        .orderByChild(childKey)
        .equalTo(equalToValue)
        .once('value');
      return snapshot.val() || {};
    } catch (error) {
      logger.error(`Firebase Helper QUERY error on path [${path}] key [${childKey}]:`, error);
      throw error;
    }
  },

  /**
   * Run a transaction on a reference path
   * @param {string} path 
   * @param {function} transactionUpdate 
   */
  async transaction(path, transactionUpdate) {
    try {
      const result = await db.ref(path).transaction(transactionUpdate);
      return result.snapshot.val();
    } catch (error) {
      logger.error(`Firebase Helper TRANSACTION error on path [${path}]:`, error);
      throw error;
    }
  }
};

module.exports = firebaseHelper;
