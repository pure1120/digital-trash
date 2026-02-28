import React, { useState, useEffect } from 'react';

// 格式化文件大小
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function App() {
  const [shreds, setShreds] = useState([]);
  const [hoveredShred, setHoveredShred] = useState(null);
  const [selectedShred, setSelectedShred] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // 物理映射逻辑：将 JSON 数据转化为碎纸条
    const processData = (rawFiles) => {
      const binWidth = 340;
      const binHeight = 350;

      const positionedShreds = rawFiles.map((file) => {
        // 大小映射长短，类型映射颜色
        const length = Math.max(40, Math.min(120, Math.log2(file.size / 1024) * 8));
        const width = Math.max(6, Math.min(14, Math.log2(file.size / 1024)));
        const yPos = binHeight - (Math.pow(Math.random(), 2) * (binHeight - 80)) - length/2;
        const xPos = Math.random() * (binWidth - 40) + 20;

        return {
          ...file, w: width, h: length, x: xPos, y: yPos,
          rotation: (Math.random() - 0.5) * 140, 
          zIndex: Math.floor(yPos), 
          bgPosition: `${Math.random() * 10}px ${Math.random() * 10}px`
        };
      });

      positionedShreds.sort((a, b) => a.y - b.y);
      setShreds(positionedShreds);
    };

    // 读取 public/trash_data.json
    fetch('/trash_data.json')
      .then(res => res.json())
      .then(data => processData(data))
      .catch(() => console.warn("未读取到真实数据，请运行脚本"));
  }, []);

  return (
    <div 
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden font-sans bg-[#C8C4B7]"
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      <div className="relative w-[380px] flex flex-col items-center z-10 drop-shadow-2xl mt-10">
        {/* 顶部纸张堆 */}
        <div className="relative w-[280px] h-[30px] z-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute bottom-0 w-[240px] h-[40px] bg-white border border-neutral-300 shadow-sm"
                 style={{ left: '20px', transform: `rotate(${(Math.random()-0.5)*6}deg) translateY(${i*-2}px)` }} />
          ))}
        </div>
        {/* 机器头 */}
        <div className="w-[360px] h-[80px] rounded-t-3xl relative z-20 flex flex-col items-center justify-end pb-4 bg-gradient-to-b from-[#EAEAEA] to-[#B0B0B0] shadow-inner border-b-4 border-[#333]">
          <div className="w-[280px] h-[8px] bg-[#111] rounded-full overflow-hidden flex justify-center">
            <div className="w-[40%] h-full bg-white opacity-20 animate-pulse" />
          </div>
        </div>
        {/* 废纸桶 */}
        <div className="w-[340px] h-[350px] relative overflow-hidden rounded-b-xl border-x-4 border-b-4 border-[#222] bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A]">
          <div className="absolute inset-0 z-10">
            {shreds.map((shred) => (
              <div key={shred.id} className="absolute cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredShred(shred)} onMouseLeave={() => setHoveredShred(null)} onClick={() => setSelectedShred(shred)}
                style={{
                  left: `${shred.x}px`, top: `${shred.y}px`, width: `${shred.w}px`, height: `${shred.h}px`,
                  backgroundColor: shred.color, border: `1px solid ${shred.borderColor}`,
                  transform: `translate(-50%, -50%) rotate(${shred.rotation}deg) ${hoveredShred?.id===shred.id ? 'scale(1.8)' : 'scale(1)'}`,
                  zIndex: hoveredShred?.id===shred.id ? 9999 : shred.zIndex,
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)',
                }} />
            ))}
          </div>
        </div>
      </div>

      {hoveredShred && !selectedShred && (
        <div className="fixed z-40 bg-[#111] text-white px-3 py-1.5 rounded text-[10px] font-mono"
             style={{ left: `${mousePos.x + 15}px`, top: `${mousePos.y + 15}px` }}>
          Click to inspect: {hoveredShred.name}
        </div>
      )}

      {selectedShred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedShred(null)}>
          <div className="relative w-[320px] bg-[#FAFAFA] p-8 font-mono shadow-2xl rotate-1" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[100px] h-[25px] bg-white/40 border border-white/50 shadow-sm" />
            <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2 mb-4">Recovered</h2>
            <div className="space-y-4">
              <p className="text-[10px] text-gray-400 uppercase">File Name: <span className="block text-black bg-gray-200 p-1 mt-1">{selectedShred.name}</span></p>
              <p className="text-[10px] text-gray-400 uppercase">Size: <span className="block text-black">{formatBytes(selectedShred.size)}</span></p>
              <p className="text-[10px] text-gray-400 uppercase">Deleted: <span className="block text-red-700 font-bold">{selectedShred.deletedAt}</span></p>
            </div>
            <button className="mt-8 w-full border border-black py-2 hover:bg-black hover:text-white transition-colors" onClick={() => setSelectedShred(null)}>CLOSE ARCHIVE</button>
          </div>
        </div>
      )}
    </div>
  );
}
