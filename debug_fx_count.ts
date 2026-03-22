import { db } from "./src/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

async function check() {
  const snap = await getDocs(collection(db, "fx_judgments"));
  console.log("Count:", snap.size);
  snap.docs.forEach(doc => console.log(doc.id));
}

check();
