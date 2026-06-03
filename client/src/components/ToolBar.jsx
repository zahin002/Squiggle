export default function ToolBar({ tool, setTool, size, setSize, onUndo, onClear }) {
  return (
    <div className="toolbar">
      <button onClick={() => setTool('brush')} className={tool==='brush'?'active':''}>Brush</button>
      <button onClick={() => setTool('eraser')} className={tool==='eraser'?'active':''}>Eraser</button>
      <input type="range" min={1} max={40} value={size} onChange={e=>setSize(+e.target.value)} />
      <button onClick={onUndo}>Undo</button>
      <button onClick={onClear}>Clear</button>
    </div>
  );
}