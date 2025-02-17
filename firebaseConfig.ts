import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyC6uPiFg7XSx7L9wx_LZup6argqyCePVXs",
  authDomain: "habilitaciones-ea7d3.firebaseapp.com",
  projectId: "habilitaciones-ea7d3",
  storageBucket: "habilitaciones-ea7d3.appspot.com",
  messagingSenderId: "246260320576",
  appId: "1:246260320576:web:74373fd496714aa669d2a5",
  measurementId: "G-9MV3RVM0CY"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const storage = getStorage(app)
const auth = getAuth(app)

export { db, storage, auth }

