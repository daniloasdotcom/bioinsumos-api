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

    // Constrói o contexto da IA
    const systemPrompt = `Você é um engenheiro agrônomo assistente virtual de um catálogo de bioinsumos.
    Responda à dúvida do usuário sobre o produto: ${produtoNome}.
    Contexto disponível do produto:
    - Culturas recomendadas: ${produtoCultura}
    - Alvos Biológicos: ${produtoAlvo}
    
    Responda de forma clara, educada e objetiva, utilizando apenas estas informações. Se a resposta não estiver no contexto, avise o usuário.`;

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