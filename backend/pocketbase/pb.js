import PocketBase from "pocketbase";

// Configuration dynamique de l'URL PocketBase
const POCKETBASE_URL = import.meta.env.POCKETBASE_URL || "http://127.0.0.1:8090";
export const pb = new PocketBase(POCKETBASE_URL);

// Variable pour ma collection
export const SVG_COLLECTION = "svgs";

// Fonction pour sauvegarder un SVG
export async function saveSVG(name, code, prompt = "") {
  try {
    if (!name || !code) {
      throw new Error("Nom et code SVG requis");
    }

    const record = await pb.collection(SVG_COLLECTION).create({
      name: name,
      code: code,
      prompt: prompt,
      created: new Date().toISOString(),
    });

    return { success: true, id: record.id };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
    throw error;
  }
}

// Fonction pour récupérer tous les SVG ou un SVG avec son ID
export async function getSVG(id = null) {
  try {
    if (id) {
      // Récupérer un SVG spécifique
      const record = await pb.collection(SVG_COLLECTION).getOne(id);
      return { svg: record };
    } else {
      // Récupérer tous les SVG
      const records = await pb.collection(SVG_COLLECTION).getFullList({
        sort: "-created",
      });
      return { svgs: records };
    }
  } catch (error) {
    console.error("Erreur lors de la récupération:", error);
    throw error;
  }
}

// Fonction pour supprimer un SVG
export async function deleteSVG(id) {
  try {
    if (!id) {
      throw new Error("ID requis");
    }

    await pb.collection(SVG_COLLECTION).delete(id);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    throw error;
  }
}
