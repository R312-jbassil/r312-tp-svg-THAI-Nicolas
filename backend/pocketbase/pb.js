import PocketBase from "pocketbase";

// Configuration dynamique de l'URL PocketBase
const POCKETBASE_URL =
  import.meta.env.POCKETBASE_URL || "http://127.0.0.1:8090";
export const pb = new PocketBase(POCKETBASE_URL);

// Variable pour ma collection
export const SVG_COLLECTION = "svgs";

// Fonction pour sauvegarder un SVG avec ta structure existante
export async function saveSVG(name, code, prompt = "") {
  try {
    if (!name || !code) {
      throw new Error("Nom et code SVG requis");
    }

    const record = await pb.collection(SVG_COLLECTION).create({
      name: name,
      code: code, // Ton champ existant
      prompt: prompt, // Ton champ existant
      created: new Date().toISOString(),
    });

    return { success: true, id: record.id };
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
    throw error;
  }
}

// Fonction pour récupérer tous les SVG
export async function getAllSVGs() {
  try {
    const records = await pb.collection(SVG_COLLECTION).getFullList({
      sort: "-created",
    });
    return { svgs: records };
  } catch (error) {
    console.error("Erreur lors de la récupération:", error);
    throw error;
  }
}

// Fonction pour récupérer un SVG par ID
export async function getSVGById(id) {
  try {
    const record = await pb.collection(SVG_COLLECTION).getOne(id);
    return { svg: record };
  } catch (error) {
    console.error("Erreur lors de la récupération:", error);
    throw error;
  }
}

// Fonction pour récupérer tous les SVG ou un SVG avec son ID (ancienne fonction pour compatibilité)
export async function getSVG(id) {
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

// Fonction pour mettre à jour un SVG
export async function updateSVG(id, updateData) {
  try {
    if (!id) {
      throw new Error("ID requis");
    }

    const record = await pb.collection(SVG_COLLECTION).update(id, updateData);
    return { success: true, id: record.id, data: record };
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
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
