import { db } from "./src/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

async function checkData() {
  try {
    const querySnapshot = await getDocs(collection(db, "japanese_stocks"));
    console.log(`Found ${querySnapshot.size} documents in japanese_stocks.`);
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} =>`, doc.data());
    });
  } catch (e) {
    console.error("Error checking data:", e);
  }
}

checkData();
