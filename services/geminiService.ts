import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const explainMixState = async (state: AppState): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Key is missing. Cannot generate explanation.";

  const prompt = `
    You are a professional DJ instructor. Explain the current status of the DJ mixer based on the following technical state to a beginner student.
    Focus on signal flow: which track is audible, how the EQs and Faders are shaping the sound, and what the audience is hearing.
    Keep it concise (max 3 sentences).

    State:
    Deck A (Left - Cyan): ${state.deckA.isPlaying ? "PLAYING" : "STOPPED"}, Channel Fader: ${Math.round(state.deckA.volume * 100)}%, EQ(L/M/H): ${Math.round(state.deckA.eq.low*100)}/${Math.round(state.deckA.eq.mid*100)}/${Math.round(state.deckA.eq.high*100)}.
    Deck B (Right - Pink): ${state.deckB.isPlaying ? "PLAYING" : "STOPPED"}, Channel Fader: ${Math.round(state.deckB.volume * 100)}%, EQ(L/M/H): ${Math.round(state.deckB.eq.low*100)}/${Math.round(state.deckB.eq.mid*100)}/${Math.round(state.deckB.eq.high*100)}.
    Crossfader: ${state.mixer.crossfader.toFixed(2)} (-1 is Left, 0 is Center, 1 is Right).
    
    Output format: Plain text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No explanation generated.";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "Unable to contact the AI DJ instructor at the moment.";
  }
};