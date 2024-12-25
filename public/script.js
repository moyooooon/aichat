// チャットインターフェースの要素取得
const chatHistoryDiv = document.getElementById("chat-history"); // チャット履歴表示エリア
const userInput = document.getElementById("user-input");       // ユーザー入力欄
const sendButton = document.getElementById("send-button");     // 送信ボタン

//ずんだもん読み上げAPI
const zundaAPI = "https://deprecatedapis.tts.quest/v2/voicevox/audio/?key=t-023676t-567-a&speaker=1&pitch=0&intonationScale=1&speed=1.2&text="


// メッセージ送信処理
async function sendMessage() {
  const message = userInput.value.trim(); // 入力内容を取得し、不要な空白を削除
  if (!message) return; // 入力が空の場合は処理を終了

  // ユーザーメッセージをチャット画面に追加
  appendMessage("user", message);

    //  サーバへ送信
    try {
        const response = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }, // JSON形式で送信
          body: JSON.stringify({ message }),             // メッセージ本文を送信
        });
        // サーバーからの応答を確認
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        //サーバからAIのメッセージを受け取る
        const data = await response.json();

        //読み上げ、描画
        appendMessageAI("ai", data.response);

    } catch (error) {
        console.error('Error sending message:', error);
        appendMessage("error", "メッセージの送信に失敗しました");
    } finally {
    userInput.value = ""; // 入力欄をクリア
  }

}


// チャット画面にメッセージを追加する汎用関数
function appendMessage(sender, text) {
  const messageDiv = document.createElement("div"); // メッセージ表示用のdiv要素を作成
  messageDiv.classList.add("message", sender);      // メッセージの種類を指定（ユーザー/AI/エラー）
  messageDiv.textContent = text;                   // メッセージ本文を設定
  chatHistoryDiv.appendChild(messageDiv);          // チャット履歴エリアに追加
  chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight; // 最新メッセージにスクロール
}


// AI処理
// AIメッセージを描画エリアに組み込む
function appendMessageAI(sender, data) {
  // 正規表現で分割「happy:::こんにちは」
  const split = data.split(":::");

  if (split && split.length === 2) {
    const emotion = split[0]; // 例: "happy"
    const message = split[1]; // 例: "こんにちは。"

    //読み上げURL生成
    let apiUrl = zundaAPI + message;

    // AIメッセージの親コンテナ作成
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message-container", sender);

    // アイコン画像要素作成
    const img = document.createElement("img");
    img.src = `${emotion}.jpg`;
    img.alt = emotion;
    img.classList.add("message", sender, "icon");

    // テキスト要素作成（初期状態は "..."）
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.textContent = "入力中...";

    // 親コンテナに要素を追加
    messageContainer.appendChild(img);
    messageContainer.appendChild(messageDiv);

    // コンテナを描画領域に追加
    chatHistoryDiv.appendChild(messageContainer);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

    // 音声再生を呼び出し、再生開始時メッセージを更新
    playAudioFromAPI(apiUrl).then(() => {
      messageDiv.textContent = message;
    }).catch(error => {
      console.error("Error during audio playback:", error);
    });

  } else {
    console.log("Input does not match the expected format.");
    return data;
  }
}

// 音声を再生し、Promise を返す関数
async function playAudioFromAPI(apiUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      // ずんだもんボイスAPI接続
      const response = await fetch(apiUrl);

      // レスポンス確認
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      // 音声を再生する
      const audio = new Audio(apiUrl);

      audio.addEventListener('loadedmetadata', function () {
        audio.play().then(() => {
          console.log("Audio playback started.");
          resolve(); // 再生が開始されたら Promise を解決

        }).catch(error => {
          reject(error);
        });
      });

      audio.addEventListener('error', function (error) {
        reject(new Error("Error loading or playing audio: " + error));
      });

    } catch (error) {
      reject(error); // エラーを通知
    }
  });
}


//イベントリスナー：送信ボタン
sendButton.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});