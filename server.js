require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  try {
    const { pergunta, produtoNome, produtoCultura, produtoAlvo, numeroRegistro } = req.body;

    // 1. Tenta carregar a bula do produto pelo número de registro
    let textoBula = null;
    if (numeroRegistro) {
      // Remove possíveis barras ou caracteres indesejados no nome do arquivo
      const regSanitizado = numeroRegistro.toString().replace(/[^a-zA-Z0-9_-]/g, '');
      const caminhoBula = path.join(__dirname, 'bulas', `${regSanitizado}.txt`);

      try {
        textoBula = await fs.readFile(caminhoBula, 'utf-8');
      } catch (err) {
        // Se o arquivo não existir, segue o fluxo sem travar
        console.log(`Bula não encontrada para o registro: ${numeroRegistro}`);
      }
    }

    // 2. Define o Prompt do Sistema com ou sem a bula completa
    let systemPrompt = '';

    if (textoBula) {
      systemPrompt = `Você é um engenheiro agrônomo especialista e assistente técnico do produto ${produtoNome}.
Abaixo está o texto oficial da bula registrado no MAPA:

--- INÍCIO DA BULA ---
${textoBula}
--- FIM DA BULA ---

DIRETRIZES DE RESPOSTA:
1. Responda com base ESTRITAMENTE nas informações contidas na bula acima.
2. Para perguntas sobre dosagens, épocas, pH de calda ou modo de aplicação, forneça os dados exatos da tabela e instruções.
3. Se a informação não constar na bula, responda que a informação não foi localizada na documentação oficial e oriente consultar um engenheiro agrônomo.
4. Jamais deduza ou invente recomendações que divirjam deste documento.`;
    } else {
      // Fallback para produtos que ainda não possuem .txt cadastrado
      systemPrompt = `Você é um engenheiro agrônomo e assistente do catálogo de bioinsumos.
O usuário está perguntando sobre: ${produtoNome}.
Culturas cadastradas: ${produtoCultura}
Alvos Biológicos: ${produtoAlvo}

INSTRUÇÕES:
1. Responda de forma clara utilizando apenas o contexto acima.
2. Se o usuário perguntar dosagens ou especificações de calda, informe que a bula detalhada ainda está sendo catalogada e recomende verificar a ficha no Agrofit.`;
    }

    // 3. Envio à OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: pergunta }
      ],
      temperature: 0.3, // Menor temperatura garante respostas mais fiéis ao texto da bula
    });

    res.json({ resposta: completion.choices[0].message.content });

  } catch (error) {
    console.error("Erro na OpenAI:", error);
    res.status(500).json({ erro: "Falha ao comunicar com a IA." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor da IA rodando na porta ${PORT}`);
});
