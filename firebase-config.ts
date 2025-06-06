import {initializeApp} from "firebase/app"
import {getFirestore} from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAZPMgEND_ONI83lqjzBns2UYH5Iv8p94o",
  authDomain: "food-deals--products-store.firebaseapp.com",
  projectId: "food-deals--products-store",
  storageBucket: "food-deals--products-store.firebasestorage.app",
  messagingSenderId: "587056369355",
  appId: "1:587056369355:web:585b5059746610eab9154e",
  measurementId: "G-MCGPTSGSQC"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)