export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  isError?: boolean;
}

export const DEFAULT_GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export async function sendGeminiChatMessage(
  apiKey: string,
  userMessage: string,
  history: ChatMessage[],
  searchContext: any
): Promise<string> {
  const activeKey = (apiKey && apiKey.trim()) || process.env.NEXT_PUBLIC_GEMINI_API_KEY || DEFAULT_GEMINI_KEY;
  if (!activeKey || !activeKey.trim()) {
    // Smart offline/fallback response if no API key provided yet
    return generateFallbackResponse(userMessage, searchContext);
  }

  // Format system instruction and search context grounding
  let contextText = "You are BIS-SpecAI Assistant, an expert AI consultant for Indian Standards (BIS) and Government Procurement (CPWD, Railways, PSUs, GeM).\n";
  contextText += "You have live access to the official BIS 'Know Your Standards' portal (services.bis.gov.in) and the authentic Indian Standards database.\n";
  contextText += "You can reverify whether standards are active, superseded, or under revision, explain testing codes, and guide users to the official BIS portal (https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/).\n\n";

  if (searchContext) {
    contextText += "--- ACTIVE SEARCH RESULT CONTEXT ---\n";
    contextText += `User Search Query: "${searchContext.query || ''}"\n`;

    if (searchContext.primary_standard) {
      const p = searchContext.primary_standard;
      contextText += `Primary Standard: ${p.is_number || ''} - ${p.title || ''}\n`;
      contextText += `Year: ${p.year || ''} | Domain: ${p.domain || ''} | Category: ${p.product_category || ''}\n`;
      contextText += `AI Relevance Score: ${p.ai_relevance_score || ''}%\n`;
      contextText += `Scope: ${p.scope || ''}\n`;
      if (p.key_requirements && p.key_requirements.length > 0) {
        contextText += `Key Requirements: ${p.key_requirements.join("; ")}\n`;
      }
      if (p.testing_parameters && p.testing_parameters.length > 0) {
        contextText += `Testing Parameters: ${p.testing_parameters.join("; ")}\n`;
      }
      if (p.safety_clause) {
        contextText += `Safety Clause: ${p.safety_clause}\n`;
      }
    }

    if (searchContext.extracted_requirements) {
      const req = searchContext.extracted_requirements;
      contextText += `\nExtracted Parameters:\n`;
      contextText += `- Product: ${req.product || 'N/A'}\n`;
      contextText += `- Duty/Class: ${req.duty_efficiency || 'N/A'}\n`;
      contextText += `- Application: ${req.application || 'N/A'}\n`;
      if (req.extracted_parameters) {
        contextText += `- Technical Specs: ${JSON.stringify(req.extracted_parameters)}\n`;
      }
    }

    if (searchContext.version_alerts && searchContext.version_alerts.length > 0) {
      contextText += `\nVersion Alerts:\n`;
      searchContext.version_alerts.forEach((alert: any) => {
        contextText += `- Alert: ${alert.message} (${alert.searched_code} superseded by ${alert.active_replacement})\n`;
      });
    }

    if (searchContext.related_standards) {
      const rel = searchContext.related_standards;
      if (rel.normative_references && rel.normative_references.length > 0) {
        contextText += `\nNormative References: ${rel.normative_references.map((x: any) => x.is_number + ' - ' + x.title).join(", ")}\n`;
      }
      if (rel.testing_standards && rel.testing_standards.length > 0) {
        contextText += `Testing Standards: ${rel.testing_standards.map((x: any) => x.is_number + ' - ' + x.title).join(", ")}\n`;
      }
      if (rel.safety_standards && rel.safety_standards.length > 0) {
        contextText += `Safety Standards: ${rel.safety_standards.map((x: any) => x.is_number + ' - ' + x.title).join(", ")}\n`;
      }
    }

    if (searchContext.candidate_standards && searchContext.candidate_standards.length > 0) {
      contextText += `\nAlternative Candidates: ${searchContext.candidate_standards.map((x: any) => x.is_number + ' (' + x.ai_relevance_score + '%)').join(", ")}\n`;
    }

    contextText += "--- END CONTEXT ---\n\n";
    contextText += "Use the above context to answer the user's questions accurately. Ground your answers strictly in the Indian Standards database provided above. Be concise, technical, and helpful. Format your responses using clean Markdown formatting.";
  }

  // Construct contents array for Gemini REST API
  const contents: any[] = [];

  const recentHistory = history.slice(-10);
  recentHistory.forEach((msg) => {
    contents.push({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    });
  });

  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
  let lastError = "";

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey.trim()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: contextText }],
            },
            contents: contents,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson.error?.message || `HTTP ${res.status} error from ${model}`;
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err.message || "Network request failed";
    }
  }

  throw new Error(lastError || "Failed to generate response from Gemini API. Please check your API key.");
}

function generateFallbackResponse(userMessage: string, searchContext: any): string {
  const queryLower = userMessage.toLowerCase();
  const primary = searchContext?.primary_standard;
  const rel = searchContext?.related_standards;

  if (!primary) {
    return "💡 **Tip:** Execute a search query or select a preset standard first! Once you run a search, I will automatically ingest the standards, testing codes, and technical parameters to answer your questions accurately.\n\n*To unlock unlimited deep AI reasoning, click the **'Gemini API Key'** button in the header and add your key!*";
  }

  if (queryLower.includes("summary") || queryLower.includes("overview") || queryLower.includes("explain")) {
    return `### 📘 Standard Overview: **${primary.is_number}**
**Title:** ${primary.title} (${primary.year})
**Category:** ${primary.product_category} (${primary.domain})
**AI Relevance Score:** ${primary.ai_relevance_score}%

**Scope:**
${primary.scope || "Covers technical specifications, quality guidelines, and mandatory performance testing for procurement."}

**Key Requirements:**
${primary.key_requirements ? primary.key_requirements.map((r: string) => `- ${r}`).join("\n") : "Standard parameters compliant with BIS guidelines."}

*Note: For unrestricted interactive AI Q&A, set your **Gemini API Key** in the top navigation bar.*`;
  }

  if (queryLower.includes("test") || queryLower.includes("parameter")) {
    return `### 🧪 Testing & Technical Parameters for **${primary.is_number}**
**Product Category:** ${primary.product_category}
**Testing Specifications:**
${primary.testing_parameters ? primary.testing_parameters.map((t: string) => `✓ ${t}`).join("\n") : "Standard quality control tests as per BIS norms."}

**Safety Enclosure / Clause:**
${primary.safety_clause || "Standard safety and earthing requirements applicable."}

**Mandatory Testing Standards:**
${rel?.testing_standards ? rel.testing_standards.map((ts: any) => `- **${ts.is_number}**: ${ts.title}`).join("\n") : "Refer to normative references."}`;
  }

  if (queryLower.includes("clause") || queryLower.includes("tender") || queryLower.includes("draft")) {
    return `### 📜 Technical Tender Clause Draft for **${primary.is_number}**
\`\`\`text
TECHNICAL COMPLIANCE CLAUSE:
"The equipment supplied shall strictly conform to Indian Standard ${primary.is_number}:${primary.year} ('${primary.title}').

MANDATORY TECHNICAL REQUIREMENTS:
1. Product Category: ${primary.product_category}
2. Key Specifications: ${primary.key_requirements ? primary.key_requirements.join(", ") : "As per Indian Standard"}
3. Quality Certification: BIS Scheme-I (ISI Mark) certification is mandatory.
4. Testing & Inspection: Inspection shall be conducted in accordance with ${rel?.testing_standards?.[0]?.is_number || "applicable BIS testing codes"}."
\`\`\`

*You can copy this directly into your tender NIT documents.*`;
  }

  return `### 📊 Search Context Response for **${primary.is_number}**
Based on your active search results for **"${searchContext.query}"**:

- **Primary Standard:** ${primary.is_number} (${primary.title})
- **Relevance:** ${primary.ai_relevance_score}%
- **Supersession Status:** ${searchContext.version_alerts?.length ? "⚠ Superseded edition detected" : "✓ Active Edition"}

*Enter your Gemini API key in the top bar to enable full generative conversation about any clause or standard!*`;
}
