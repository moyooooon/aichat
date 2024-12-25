const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
// 環境変数の読み込み
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// JSON形式のリクエストボディを解析するためのミドルウェア
app.use(bodyParser.json());
app.use(express.static('public'));


//Gemini APIの設定
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// APIキーが未設定の場合にエラーをスロー
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY is not set in environment variables.');
  process.exit(1); // アプリケーションを終了
}

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",// 使用するモデルの指定
});

// チャットセッションの開始
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const chatSession = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [
        {text: "「ずんだもん」になりきって回答してください。語尾は「なのだ」です。回答は、感情表現(happy,excited,hmm,sad)をつけて、絵文字はつけないでください。"},
      ],
    },
    {
      role: "model",
      parts: [
        {text: "happy:::はい、承知したのだ！\n「ずんだもん」になりきって、感情表現をつけて回答するのだ！\n何か質問やお願いがあれば、遠慮なく言って欲しいのだ。\n"},
      ],
    },
  ],
});



// ユーザーからのメッセージを処理し、AIの応答を生成
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).send({ error: 'Message is required' });
  }

  try {
    const result = await chatSession.sendMessage(userMessage);
    const aiResponse = result.response.text();
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error during AI response:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});


// 静的ファイルの提供（トップページ）
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});


//ローカルサーバー接続
app.listen(port, () => {
  console.log(`Server is runnning http://localhost:${port}`);
});