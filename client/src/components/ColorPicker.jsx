const COLORS = ['#000000','#ff0000','#00aa00','#0000ff','#ffaa00','#aa00ff','#ffffff'];
export default function ColorPicker({ color, setColor }) {
  return (
    <div className="color-picker">
      {COLORS.map(c => (
        <button key={c} onClick={() => setColor(c)}
          style={{ background: c, width: 28, height: 28, border: color===c?'3px solid #333':'2px solid #ccc', borderRadius: 4 }} />
      ))}
      <input type="color" value={color} onChange={e => setColor(e.target.value)} />
    </div>
  );
}