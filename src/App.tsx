import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Sparkles, Settings, Play, Music, Share2 } from 'lucide-react';

// --- UI 組件 ---
const NeuBox = ({ children, className = '', pressed = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      ${className} transition-all duration-300 ease-in-out rounded-[20px]
      ${pressed 
        ? 'bg-[#D0D3EC] shadow-[inset_6px_6px_12px_#aeb1cb,inset_-6px_-6px_12px_#ffffff]' 
        : 'bg-[#D0D3EC] shadow-[8px_8px_16px_#aeb1cb,-8px_-8px_16px_#ffffff]'}
      ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
    `}
  >
    {children}
  </div>
);

// --- 音樂播放器 ---
const MusicPlayer = ({ keyword }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  if (!keyword) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <NeuBox className="p-3 flex items-center gap-3 pr-5" onClick={() => setIsPlaying(true)}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPlaying ? 'text-purple-600' : 'text-gray-500'}`}>
          {isPlaying ? <Music className="animate-bounce" size={20}/> : <Play size={20} fill="currentColor"/>}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-500">BGM 伴讀中</span>
          <span className="text-sm font-black text-purple-600 line-clamp-1 max-w-[120px]">{keyword}</span>
          <span className="text-[10px] text-gray-400">{isPlaying ? "播放中..." : "點擊播放"}</span>
        </div>
      </NeuBox>
      {isPlaying && (
        <iframe 
          width="1" height="1" 
          src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(keyword + " audio")}&autoplay=1`}
          className="absolute opacity-0 pointer-events-none"
        ></iframe>
      )}
    </div>
  );
};

const App = () => {
  const [note, setNote] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("gemini_key") || "");
  const [showSettings, setShowSettings] = useState(false);
  const [musicKeyword, setMusicKeyword] = useState("");

  const saveKey = (e) => {
    setApiKey(e.target.value);
    localStorage.setItem("gemini_key", e.target.value);
  };

  const generateStory = async () => {
    if (!apiKey) return alert("請先設定 API Key！");
    setIsLoading(true);
    setGeneratedText("");
    setMusicKeyword("");

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // ★★★ 關鍵修正：使用 flash 且不使用 tools (避免權限錯誤) ★★★
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      });

      const prompt = `
        角色：專業同人小說家。
        任務：
        1. 分析使用者筆記：${note}
        2. 若提到特定歌手/團體，輸出該名字為音樂關鍵字；若為影視劇則輸出 'OST'。
        3. [重要] 回應格式：第一行必須是 [MUSIC: 關鍵字]，第二行開始才是小說內容。
        4. 續寫 1500 字以上繁體中文小說，風格需模仿使用者。
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // 解析音樂
      const musicMatch = text.match(/^\[MUSIC:\s*(.*?)\]/);
      let content = text;
      if (musicMatch) {
        setMusicKeyword(musicMatch[1]);
        content = text.replace(/^\[MUSIC:\s*.*?\]/, '').trim();
      }
      setGeneratedText(content);

    } catch (error) {
      console.error(error);
      alert("生成失敗：" + error.message + "\n(請確認 API Key 是否正確且有權限)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#D0D3EC] text-[#5b5d7e] p-6 font-sans relative overflow-x-hidden">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-purple-600">MemoLive</h1>
          <p className="text-xs font-bold opacity-50">ULTIMATE EDITION (Flash)</p>
        </div>
        <NeuBox className="w-12 h-12 flex items-center justify-center" onClick={() => setShowSettings(!showSettings)}>
          <Settings size={20} />
        </NeuBox>
      </div>

      {showSettings && (
        <div className="mb-6 animate-slide-down">
          <NeuBox className="p-4" pressed>
            <input 
              type="password" placeholder="貼上 Google Gemini API Key" 
              value={apiKey} onChange={saveKey}
              className="w-full bg-transparent outline-none text-sm font-mono"
            />
          </NeuBox>
        </div>
      )}

      <MusicPlayer keyword={musicKeyword} />

      {!generatedText && (
        <div className="space-y-6">
          <NeuBox className="p-4 min-h-[300px]" pressed>
            <textarea 
              className="w-full h-full min-h-[300px] bg-transparent outline-none resize-none text-lg leading-relaxed placeholder-gray-400"
              placeholder="貼上你的筆記... AI 將為你續寫..."
              value={note} onChange={(e) => setNote(e.target.value)}
            />
          </NeuBox>
          <NeuBox onClick={generateStory} className="py-4 flex justify-center gap-2 font-bold text-purple-600 active:scale-95">
             {isLoading ? "正在創作中..." : <><Sparkles /> 開始生成 (Flash版)</>}
          </NeuBox>
        </div>
      )}

      {generatedText && (
        <div className="animate-fade-in space-y-6 pb-20">
          <NeuBox className="p-6 leading-loose text-justify text-lg whitespace-pre-wrap">
            {generatedText}
          </NeuBox>
          <NeuBox className="py-4 flex justify-center font-bold" onClick={() => setGeneratedText("")}>重置</NeuBox>
        </div>
      )}
    </div>
  );
};

export default App;
