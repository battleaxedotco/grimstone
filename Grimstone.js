class Grimstone {
  constructor(config) {
    this.config = config;
    this.db = require("./init").default(config);
    this.isValid = true;
    let requiredKeys = ["apiKey", "authDomain", "appId", "projectId"];
    requiredKeys.forEach((key) => {
      if (!new RegExp(key).test(Object.keys(config).join("|")))
        this.isValid = false;
    });
    if (!this.isValid) {
      console.error(
        `Grimstone cannot function without the following keys: ${requiredKeys.join(
          ", "
        )}. You supplied only ${Object.keys(config).join(", ")}`
      );
    }
  }
  async modifyCollection(collection, callback, mergeStatus = true) {
    if (!(await this.collectionExists(collection))) {
      console.error(`Collection of name ${collection} does not exist`);
      return null;
    }
    let results = await this.getCollection(collection, 2);
    return Promise.all(
      results.map((result) => {
        let dataMerge = callback(result.data());
        return this.db
          .collection(collection)
          .doc(result.ref.id)
          .set(dataMerge, { merge: mergeStatus })
          .catch((err) => {
            return Promise.reject(`ERROR @${result.ref.id}: ${err}`);
          })
          .then(() => {
            return Promise.resolve(result.ref.id);
          });
      })
    );
  }
  async collectionExists(collection) {
    return await this.db
      .collection(collection)
      .get()
      .then((snapshot) => {
        return snapshot.docs.length > 0;
      });
  }
  async getCollection(collection, limit = 0) {
    let res = limit
      ? await this.db.collection(collection).limit(limit)
      : await this.db.collection(collection);
    return res.get().then((snapshot) => {
      if (!snapshot.docs.length) return false;
      return Promise.all(
        snapshot.docs.map((doc) => {
          return Promise.resolve(doc);
        })
      );
    });
  }
  async queryAndModifyCollection(opts, callback, mergeStatus = true) {
    let results;
    if (!opts.collection || !(await this.collectionExists(opts.collection))) {
      console.error(`Collection of name ${opts.collection} does not exist`);
      return null;
    }
    results = await this.db.collection(opts.collection);
    if (
      Object.keys(opts).includes("collection") &&
      Object.keys(opts).length == 1
    ) {
      results = await this.getCollection(opts.collection);
    } else {
      if (opts.where)
        if (Array.isArray(opts.where[0]))
          for (let i = 0; i < opts.where.length; i++)
            results = results.where(...opts.where[i]);
        else results = results.where(...opts.where);
      if (opts.orderBy) results = results.orderBy(...opts.orderBy);
      if (opts.orderByChild) results = results.orderByChild(opts.orderByChild);
      if (opts.orderByKey) results = results.orderByKey(opts.orderByKey);
      if (opts.orderByValue) results = results.orderByValue(opts.orderByValue);
      if (opts.limit) results = results.limit(opts.limit);
      results = await results.get();
      results = results.docs;
    }
    return Promise.all(
      results.docs.map((result) => {
        let dataMerge = callback(result.data());
        return this.db
          .collection(opts.collection)
          .doc(result.ref.id)
          .set(dataMerge, { merge: mergeStatus })
          .catch((err) => {
            return Promise.reject(`ERROR @${result.ref.id}: ${err}`);
          })
          .then(() => {
            return Promise.resolve(result.ref.id);
          });
      })
    );
  }
}

module.exports = Grimstone;
