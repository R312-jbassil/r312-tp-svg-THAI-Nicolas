// src/pages/api/generateSVG.js
import { OpenAI } from "openai";

// Récupération du token d'accès à partir des variables d'environnement
const OR_TOKEN = import.meta.env.OR_TOKEN;
const DEFAULT_MODEL = "openai/gpt-oss-20b:free";

// Liste des modèles autorisés (modèles qui fonctionnent réellement)
const ALLOWED_MODELS = [
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "mistralai/mistral-7b-instruct:free"
];

// Fonction exportée pour gérer les requêtes POST
export const POST = async ({ request }) => {
  try {
    console.log("Démarrage de la génération SVG...");

    // Extraction des données du corps de la requête
    const requestData = await request.json();
    
    // Support de l'ancien format (array) et du nouveau format (object avec messages et model)
    let messages;
    let selectedModel;
    
    if (Array.isArray(requestData)) {
      // Ancien format : array de messages directement
      messages = requestData;
      selectedModel = DEFAULT_MODEL;
    } else {
      // Nouveau format : object avec messages et model
      messages = requestData.messages || [];
      selectedModel = requestData.model || DEFAULT_MODEL;
    }
    
    console.log("Messages reçus:", messages);
    console.log("Modèle sélectionné:", selectedModel);

    // Validation du modèle
    if (!ALLOWED_MODELS.includes(selectedModel)) {
      console.warn(`Modèle non autorisé: ${selectedModel}, utilisation du modèle par défaut`);
      selectedModel = DEFAULT_MODEL;
    }

    // Vérification des variables d'environnement
    if (!OR_TOKEN) {
      console.error("Variables d'environnement manquantes:", {
        OR_TOKEN: !!OR_TOKEN,
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

    console.log("Appel à l'API OpenRouter avec le modèle:", selectedModel);

    // Appel à l'API pour générer le code SVG en utilisant le modèle spécifié
    const chatCompletion = await client.chat.completions.create({
      model: selectedModel, // Modèle sélectionné par l'utilisateur
      messages: [SystemMessage, ...messages], // Messages envoyés au modèle, incluant le message système et l'historique des messages
      max_tokens: 2000,
      temperature: 0.7,
    });

    // Récupération du message généré par l'API
    const message = chatCompletion.choices[0].message || "";
    console.log("Réponse de l'API:", message);
    console.log("Contenu brut:", message.content);

    // Recherche d'un élément SVG dans le message généré
    const svgMatch = message.content.match(/<svg[\s\S]*?<\/svg>/i);
    const svgCode = svgMatch ? svgMatch[0] : "";

    console.log("SVG extrait:", svgCode ? "Trouvé" : "Non trouvé");
    if (svgCode) {
      console.log("Code SVG:", svgCode.substring(0, 100) + "...");
    } else {
      console.log("Contenu complet reçu:", message.content);
    }

    // Retourne une réponse JSON contenant le SVG généré
    return new Response(
      JSON.stringify({
        svg: svgCode || message.content,
        content: message.content,
        model: selectedModel,
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
