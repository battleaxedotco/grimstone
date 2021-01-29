import firebase from "firebase/app";
import firestore from "firebase/firestore";
export default function(config) {
  return firebase
    .initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      appId: config.appId,
      projectId: config.projectId
    })
    .firestore();
}
