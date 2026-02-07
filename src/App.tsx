import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sparkles, MessageCircle, Settings, Play, Pause, Share2, Music, Search } from 'lucide-react';

// --- 新擬態 UI 組件 ---
const NeuBox = ({ children, className = '', pressed = false, onClick, active = false }) => (
  <div 
    onClick={onClick}
    className={`
      ${className} transition-all duration-300 ease-in-out rounded-[20px]
      ${pressed || active 
        ? 'bg-[#D0D3EC] shadow-[inset_6px_6px_12px_#aeb1cb,inset_-6px_-6px_12px_#ffffff]' 
        : 'bg-[#D0D3EC] shadow-[8px_8px_16px_#aeb1cb,-8px_-8px_16px_#ffffff]'}
      ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
    `}
  >
    {children}
  </div>
);

// --- 音樂播放器 (iOS 修正版) ---
const MusicPlayer = ({ keyword }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("等待播放");
  
  if (!keyword) return null;

  // 點擊後才載入 iframe 網址，解決 iOS 禁止自動播放問題
  const videoSrc = isPlaying 
    ? `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(keyword + " audio")}&autoplay=1`
    : "";

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
      
      {/* 隱藏的播放器 (為了通過 iOS 審查，必須存在於 DOM 但隱形) */}
      {isPlaying && (
        <iframe 
          width="1" 
          height="1" 
          src={videoSrc}
          title="BGM Player"
          allow="autoplay; encrypted-media" 
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
  const [useSearch, setUseSearch] = useState(false);

  // 儲存 API Key
  const saveKey = (e) => {
    setApiKey(e.target.value);
    localStorage.setItem("gemini_key", e.target.value);
  };

  // AI 核心邏輯
  const generateStory = async () => {
    if (!apiKey) return alert("請先點擊右上角設定 API Key！");
    setIsLoading(true);
    setGeneratedText("");
    setMusicKeyword("");

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // 如果有開啟聯網，使用支援 tools 的模型
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        tools: useSearch ? [{ googleSearch: {} }] : [] 
      });

      const prompt = `
        角色：專業同人小說家。
        任務：
        1. 分析使用者筆記：${note}
        2. 若提到特定歌手/團體(如 BLACKPINK)，輸出該名字為音樂關鍵字；若為影視劇則輸出 'OST'。
        3. [重要] 回應格式：第一行必須是 [MUSIC: 關鍵字]，第二行開始才是小說內容。
        4. 若開啟聯網，請搜尋文中角色最新資訊以避免 OOC。
        5. 續寫 1500 字以上繁體中文小說，風格需模仿使用者。
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // 解析音樂標籤
      const musicMatch = text.match(/^\[MUSIC:\s*(.*?)\]/);
      let content = text;
      
      if (musicMatch) {
        setMusicKeyword(musicMatch[1]); // 設定音樂關鍵字
        content = text.replace(/^\[MUSIC:\s*.*?\]/, '').trim(); // 移除標籤，只留小說
      }

      setGeneratedText(content);
    } catch (error) {
      console.error(error);
      alert("生成失敗：" + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#D0D3EC] text-[#5b5d7e] p-6 font-sans relative overflow-x-hidden">
      
      {/* 頂部導航 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-purple-600 tracking-tight">MemoLive</h1>
          <p className="text-xs font-bold opacity-50 tracking-widest">ULTIMATE EDITION</p>
        </div>
        <NeuBox className="w-12 h-12 flex items-center justify-center" onClick={() => setShowSettings(!showSettings)}>
          <Settings size={20} />
        </NeuBox>
      </div>

      {/* 設定面板 */}
      {showSettings && (
        <div className="mb-6 animate-slide-down">
          <NeuBox className="p-4" pressed>
            <input 
              type="password" 
              placeholder="貼上 Google Gemini API Key" 
              value={apiKey}
              onChange={saveKey}
              className="w-full bg-transparent outline-none text-sm mb-4 font-mono"
            />
            <div className="flex items-center gap-3" onClick={() => setUseSearch(!useSearch)}>
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${useSearch ? 'bg-purple-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${useSearch ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="text-xs font-bold">開啟 Google 聯網搜尋 (防 OOC)</span>
            </div>
          </NeuBox>
        </div>
      )}

      {/* 音樂播放器 (自動出現) */}
      <MusicPlayer keyword={musicKeyword} />

      {/* 主輸入區 */}
      {!generatedText && (
        <div className="space-y-6">
          <NeuBox className="p-4 min-h-[300px]" pressed>
            <textarea 
              className="w-full h-full min-h-[300px] bg-transparent outline-none resize-none text-lg leading-relaxed placeholder-gray-400"
              placeholder="在此貼上你的長篇筆記 (支援 20,000 字)...&#10;AI 會自動分析風格並幫你配樂..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </NeuBox>
          
          <NeuBox onClick={generateStory} className="py-4 flex justify-center items-center gap-2 font-bold text-lg text-purple-600 active:scale-95">
             {isLoading ? <span className="animate-pulse">正在搜尋資料與配樂...</span> : <><Sparkles /> 開始聯網續寫 (1500字)</>}
          </NeuBox>
        </div>
      )}

      {/* 結果顯示區 */}
      {generatedText && (
        <div className="animate-fade-in space-y-6 pb-20">
          <NeuBox className="p-6 md:p-8 leading-loose text-justify text-lg tracking-wide whitespace-pre-wrap">
            {generatedText}
          </NeuBox>
          
          <div className="flex gap-4">
             <NeuBox className="flex-1 py-4 flex justify-center gap-2 font-bold" onClick={() => setGeneratedText("")}>
               重置
             </NeuBox>
             <NeuBox className="flex-1 py-4 flex justify-center gap-2 font-bold text-purple-600">
               <Share2 size={18} /> 生成金句卡片
             </NeuBox>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
