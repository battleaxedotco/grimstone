# grimstone

Agnostic mass modifier of firestore collections.

## Installation

```bash
npm i grimstone
```

## Getting Started

Grimstone is a Class object due to needing to initialize the firestore database:

```js
import Grimstone from "grimstone";

// It requires an Object parameter of firestore credentials on initialization:
const grimstone = new Grimstone(config);
```

`config` object is a 1:1 parallel of firebase credentials:

```js
const config = {
  apiKey: "XXX",
  appId: "XXX",
  authDomain: "XXX",
  projectId: "XXX",
};
const grimstone = new Grimstone(config);
```

All above keys are required. You can either save this as a local file somewhere:

```js
// A standalone config.js file
export default {
  apiKey: "XXX",
  appId: "XXX",
  authDomain: "XXX",
  projectId: "XXX",
};
```

## **^ Do not forget to flag the above file to .gitignore to prevent leaking API keys**

Then import and use it:

```js
import config from "../config";
import Grimstone from "grimstone";
const grimstone = new Grimstone(config);
```

Or use .env file syntax:

```js
const grimstone = new Grimstone({
  apiKey: process.env.VUE_APP_APIKEY,
  appId: process.env.VUE_APP_APPID,
  authDomain: process.env.VUE_APP_AUTHDOMAIN,
  projectId: process.env.VUE_APP_PROJECTID,
});
```

---

# API

## **async** modifyCollection(collection, callback[, mergeData?])

`grimstone.modifyCollection()` will read all items within a given collection, pass them to a callback function, then rewrite (or overwrite) the entry in the database.

| Param      | Type       | Default |                                                                                                                                                     Description |
| :--------- | :--------- | :------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| collection | `String`   | `null`  |                                                                                         The name of the collection to target, as in `"users"`, `"orders"`, etc. |
| callback   | `Function` | `null`  |                                 The callback function which receives the entry data as a parameter, then returns a result which is written back to the database |
| mergeData  | `Boolean`  | `true`  | When `true`, the callback return value is intuitively merged into the object. When `false`, the database entry is completely overwritten by the callback return |

### Examples

We have a large database where we need to make a mass change to some key of every entry, like an email:

```js
// First we import and initialize Grimstone with our credentials:
import config from "../config";
import Grimstone from "grimstone";
const grimstone = new Grimstone(config);

// We call modifyCollection on a specific collection, passing it's name and our own callback function:
let result = await grimstone.modifyCollection("orders", modifyItem);

// The callback function receives the current document. This callback should be synchronous, not async:
function modifyItem(item) {
  return {
    email: item.email.toLowerCase().trim(),
  };
}
```

In the above, we don't pass in any value in the return object except email because `mergeData` is `true` by default. A more in-depth look at what's happening:

```js
function modifyItem(item) {
  console.log(item);
  /* This may be data like:
   *    {
   *       email: "SomeRando@gmail.com    ",
   *       license: "XXXXXX",
   *       productName: "Timelord"
   *    }
   */

  // When we use a return value like this:
  return {
    email: item.email.toLowerCase().trim(),
  };
  /* We're telling firestore that we only want to modify the key/values in the above
   * object. The object will be rewritten in the database as:
   *    {
   *       email: "somerando@gmail.com",
   *       license: "XXXXXX",
   *       productName: "Timelord"
   *    }
   */
}
```

When `mergeData` is `false`, then it opts for a complete rewrite of the database object:

```js
let result = await grimstone.modifyCollection("orders", modifyItem, false);

function modifyItem(item) {
  console.log(item);
  /* This may be data like:
   *    {
   *       email: "SomeRando@gmail.com    ",
   *       license: "XXXXXX",
   *       productName: "Timelord"
   *    }
   */
  return {
    email: item.email.toLowerCase().trim(),
  };
  /* Since we're not merging (we're instead overwriting), the result in our database
   * will be the direct return value above:
   *    {
   *       email: "somerando@gmail.com",
   *    }
   */
}
```
