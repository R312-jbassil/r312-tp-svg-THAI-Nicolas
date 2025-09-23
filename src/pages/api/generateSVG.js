// src/pages/api/generateSVG.js
import { OpenAI } from "openai";

// Récupération du token d'accès à partir des variables d'environnement
const OR_TOKEN = import.meta.env.OR_TOKEN;
const NOM_MODEL = import.meta.env.NOM_MODEL;

// Fonction exportée pour gérer les requêtes POST
export const POST = async ({ request }) => {
  try {
    console.log("Démarrage de la génération SVG...");

    // Extraction des messages du corps de la requête
    const messages = await request.json();
    console.log("Messages reçus:", messages);

    // Vérification des variables d'environnement
    if (!OR_TOKEN || !NOM_MODEL) {
      console.error("Variables d'environnement manquantes:", {
        OR_TOKEN: !!OR_TOKEN,
        NOM_MODEL,
      });
      throw new Error("Configuration API manquante");
    }

    // Initialisation du client OpenAI avec l'URL de base et le token d'API
    const client = new OpenAI({
      baseURL: import.meta.env.OR_URL, // URL de l'API
      apiKey: OR_TOKEN, // Token d'accès pour l'API
    });

    // Création du message système pour guider le modèle
    let SystemMessage = {
      role: "system", // Rôle du message
      content:
        "You are an SVG code generator. Generate SVG code for the following messages. Make sure to include ids for each part of the generated SVG. Always respond with complete, valid SVG code.", // Contenu du message
    };

    console.log("Appel à l'API OpenRouter...");

    // Appel à l'API pour générer le code SVG en utilisant le modèle spécifié
    const chatCompletion = await client.chat.completions.create({
      model: NOM_MODEL, // Nom du modèle à utiliser
      messages: [SystemMessage, ...messages], // Messages envoyés au modèle, incluant le message système et l'historique des messages
      max_tokens: 2000,
      temperature: 0.7,
    });

    // Récupération du message généré par l'API
    const message = chatCompletion.choices[0].message || "";
    console.log("Réponse de l'API:", message);

    // Recherche d'un élément SVG dans le message généré
    const svgMatch = message.content.match(/<svg[\s\S]*?<\/svg>/i);
    const svgCode = svgMatch ? svgMatch[0] : "";

    console.log("SVG extrait:", svgCode ? "Trouvé" : "Non trouvé");

    // Retourne une réponse JSON contenant le SVG généré
    return new Response(
      JSON.stringify({
        svg: svgCode || message.content,
        content: message.content,
        success: true,
      }),
      {
        headers: { "Content-Type": "application/json" }, // Définit le type de contenu de la réponse
      }
    );
  } catch (error) {
    console.error("Erreur dans generateSVG:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Erreur inconnue",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
