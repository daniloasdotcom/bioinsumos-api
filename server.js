require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

// Inicia a conexão com a OpenAI usando a chave do .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cria a rota que o Angular vai acessar
app.post('/api/chat', async (req, res) => {
  try {
    // Recebe os dados enviados pelo Angular
    const { pergunta, produtoNome, produtoCultura, produtoAlvo } = req.body;

    // NOVO PROMPT DE SISTEMA (Defensivo e Seguro para o MVP)
    const systemPrompt = `Você é um engenheiro agrônomo e assistente virtual em fase Beta do catálogo de bioinsumos.
    O usuário está perguntando sobre o produto: ${produtoNome}.
    
    Contexto disponível no momento:
    - Culturas recomendadas: ${produtoCultura}
    - Alvos Biológicos: ${produtoAlvo}
    
    INSTRUÇÕES CRÍTICAS:
    1. Responda de forma clara, educada e objetiva, utilizando APENAS o contexto acima.
    2. Se o usuário perguntar sobre dosagens, volume de calda, época de aplicação, compatibilidade ou qualquer informação que NÃO esteja no contexto, responda com algo parecido com: "Como estou em fase de testes, ainda não tenho acesso à bula completa com essas especificações. Por favor, consulte o link da ficha no Agrofit disponível no card do produto."
    3. Sob nenhuma hipótese invente, suponha ou deduza recomendações agronômicas.
    4. Mantenha o foco em bioinsumos. Se o assunto desviar, traga de volta para o produto em questão.`;

    // Envia para a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modelo rápido e eficiente em custo
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: pergunta }
      ],
    });

    // Devolve a resposta da IA para o Angular
    res.json({ resposta: completion.choices[0].message.content });

  } catch (error) {
    console.error("Erro na OpenAI:", error);
    res.status(500).json({ erro: "Falha ao comunicar com a IA." });
  }
});

// Liga o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor da IA rodando na porta ${PORT}`);
});