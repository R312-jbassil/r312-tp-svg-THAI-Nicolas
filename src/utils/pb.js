import PocketBase from "pocketbase";

// Configuration dynamique de l'URL PocketBase
const POCKETBASE_URL =
  import.meta.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const pb = new PocketBase(POCKETBASE_URL);

export default pb;
